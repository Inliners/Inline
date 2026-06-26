import type { SupabaseClient } from '@supabase/supabase-js'
import { embedText } from './embeddings'
import { safeSnippet } from './text'
import { MIN_DISPLAY_SIMILARITY, extractCitationRefs, filterSourcesForDisplay } from './citations'

export { MIN_DISPLAY_SIMILARITY, extractCitationRefs, filterSourcesForDisplay }

/**
 * Semantic retrieval over public.workspace_embeddings with a recency-based
 * fallback when vector search is unavailable. All queries run on the
 * caller's RLS-scoped Supabase client.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyClient = SupabaseClient<any, any, any>
/* eslint-enable @typescript-eslint/no-explicit-any */

export type RetrievedChunk = {
  id: string
  source_type: string
  source_id: string
  page_url: string | null
  page_title: string | null
  domain: string | null
  chunk_text: string
  chunk_index: number
  similarity: number
}

export type RagSource = {
  /** Citation number used in the prompt, 1-based. */
  ref: number
  sourceType: string
  sourceId: string
  pageUrl: string | null
  pageTitle: string | null
  domain: string | null
  snippet: string
  similarity: number | null
}

export type RetrievalResult = {
  mode: 'semantic' | 'recency' | 'none'
  unindexed: boolean
  chunks: RetrievedChunk[]
}

async function countWorkspaceEmbeddings(
  supabase: AnyClient,
  workspaceId: string,
): Promise<number> {
  const wid = workspaceId || ''
  const { count } = await supabase
    .from('workspace_embeddings')
    .select('id', { count: 'exact', head: true })
    .or(`workspace_id.eq.${wid},workspace_id.eq.`)
  return count ?? 0
}

async function rpcMatch(
  supabase: AnyClient,
  queryEmbedding: number[],
  workspaceId: string,
  matchCount: number,
  matchThreshold: number,
): Promise<RetrievedChunk[]> {
  const args = {
    p_workspace_id: workspaceId || null,
    match_count: matchCount,
    match_threshold: matchThreshold,
  }

  const attempts: string[] = [
    JSON.stringify(queryEmbedding),
    `[${queryEmbedding.join(',')}]`,
  ]

  for (const query_embedding of attempts) {
    const { data, error } = await supabase.rpc('match_workspace_embeddings', {
      ...args,
      query_embedding,
    })
    if (!error && Array.isArray(data) && data.length > 0) {
      return data as RetrievedChunk[]
    }
    if (error) {
      console.warn('[rag] match_workspace_embeddings:', error.message)
    }
  }

  return []
}

/**
 * Top-k cosine retrieval. Falls back to recency only when semantic search cannot
 * run at all (no embeddings table, no AI key, or zero indexed content).
 */
export async function retrieveRelevantChunks(
  supabase: AnyClient,
  workspaceId: string,
  query: string,
  { matchCount = 12, matchThreshold = 0.35 }: { matchCount?: number; matchThreshold?: number } = {},
): Promise<RetrievalResult> {
  const indexedCount = await countWorkspaceEmbeddings(supabase, workspaceId)

  let queryEmbedding: number[] | null = null
  try {
    queryEmbedding = await embedText(query)
  } catch {
    queryEmbedding = null
  }

  if (queryEmbedding) {
    try {
      for (const threshold of [matchThreshold, 0.25, 0.15]) {
        const chunks = await rpcMatch(supabase, queryEmbedding, workspaceId, matchCount, threshold)
        if (chunks.length > 0) {
          return { mode: 'semantic', unindexed: false, chunks }
        }
      }

      if (indexedCount > 0) {
        return { mode: 'semantic', unindexed: false, chunks: [] }
      }
    } catch (err) {
      console.warn('[rag] semantic retrieval failed:', (err as Error)?.message)
    }
  }

  if (indexedCount > 0) {
    return { mode: 'semantic', unindexed: false, chunks: [] }
  }

  return { mode: 'recency', unindexed: true, chunks: [] }
}

/** Fetch recent notes for the fallback path when vector search is unavailable. */
export async function fetchRecentNotes(
  supabase: AnyClient,
  workspaceId: string,
  limit = 12,
): Promise<RetrievedChunk[]> {
  const { data } = await supabase
    .from('notes')
    .select('id, page_title, domain, page_url, content, type, created_at')
    .or(`workspace_id.eq.${workspaceId},workspace_id.is.null,workspace_id.eq.dashboard`)
    .order('created_at', { ascending: false })
    .limit(limit)

  type Row = { id: string; page_title: string | null; domain: string | null; page_url: string | null; content: string | null; type: string | null }
  return ((data ?? []) as Row[]).map((n, i) => ({
    id: `recent-${i}`,
    source_type: 'note',
    source_id: n.id,
    page_url: n.page_url,
    page_title: n.page_title,
    domain: n.domain,
    chunk_text: (n.content ?? '').slice(0, 800),
    chunk_index: 0,
    similarity: 0,
  }))
}

/** Collapse multiple chunks of the same source into one citable source. */
export function dedupeSources(chunks: RetrievedChunk[]): RagSource[] {
  const bySource = new Map<string, RagSource>()
  for (const chunk of chunks) {
    const key = `${chunk.source_type}:${chunk.source_id}`
    const existing = bySource.get(key)
    if (existing) {
      if (chunk.similarity > (existing.similarity ?? 0)) {
        existing.similarity = chunk.similarity
      }
      continue
    }
    bySource.set(key, {
      ref: bySource.size + 1,
      sourceType: chunk.source_type,
      sourceId: chunk.source_id,
      pageUrl: chunk.page_url,
      pageTitle: chunk.page_title,
      domain: chunk.domain,
      snippet: safeSnippet(chunk.chunk_text),
      similarity: chunk.similarity > 0 ? chunk.similarity : null,
    })
  }
  return Array.from(bySource.values())
}

/**
 * Build the numbered context block for the prompt. Each chunk is tagged with
 * the citation ref of its (deduped) source so the model can only cite
 * sources that actually exist.
 */
export function formatSourcesForPrompt(chunks: RetrievedChunk[], sources: RagSource[]): string {
  const refByKey = new Map(sources.map(s => [`${s.sourceType}:${s.sourceId}`, s.ref]))
  return chunks
    .map((chunk) => {
      const ref = refByKey.get(`${chunk.source_type}:${chunk.source_id}`) ?? 0
      const label = chunk.page_title || chunk.domain || chunk.source_type
      return `[${ref}] (${chunk.source_type}${chunk.domain ? ` — ${chunk.domain}` : ''}: ${label})\n${chunk.chunk_text.slice(0, 1200)}`
    })
    .join('\n\n')
}
