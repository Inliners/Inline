import type { SupabaseClient } from '@supabase/supabase-js'
import { embedText } from './embeddings'
import { safeSnippet } from './text'

/**
 * Semantic retrieval over public.workspace_embeddings with a recency-based
 * fallback for workspaces that have not been indexed yet. All queries run on
 * the caller's RLS-scoped Supabase client.
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
  /** True when the workspace has no embeddings yet (indexing not run). */
  unindexed: boolean
  chunks: RetrievedChunk[]
}

/**
 * Top-k cosine retrieval. Falls back to recency when:
 * - the workspace has zero embeddings (returns mode 'recency', unindexed true)
 * - the RPC/extension is missing (migration not applied)
 * - no AI key is available to embed the query
 */
export async function retrieveRelevantChunks(
  supabase: AnyClient,
  workspaceId: string,
  query: string,
  { matchCount = 12, matchThreshold = 0.45 }: { matchCount?: number; matchThreshold?: number } = {},
): Promise<RetrievalResult> {
  let queryEmbedding: number[] | null = null
  try {
    queryEmbedding = await embedText(query)
  } catch {
    queryEmbedding = null
  }

  if (queryEmbedding) {
    try {
      const { data, error } = await supabase.rpc('match_workspace_embeddings', {
        query_embedding: JSON.stringify(queryEmbedding),
        p_workspace_id: workspaceId || null,
        match_count: matchCount,
        match_threshold: matchThreshold,
      })
      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          return { mode: 'semantic', unindexed: false, chunks: data as RetrievedChunk[] }
        }
        // Distinguish "indexed but nothing relevant" from "never indexed".
        const { count } = await supabase
          .from('workspace_embeddings')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId || '')
        if ((count ?? 0) > 0) {
          return { mode: 'semantic', unindexed: false, chunks: [] }
        }
      }
    } catch {
      // RPC missing (migration not applied) — fall through to recency.
    }
  }

  return { mode: 'recency', unindexed: true, chunks: [] }
}

/** Fetch recent notes for the recency fallback path. */
export async function fetchRecentNotes(
  supabase: AnyClient,
  workspaceId: string,
  limit = 30,
): Promise<RetrievedChunk[]> {
  const { data } = await supabase
    .from('notes')
    .select('id, page_title, domain, page_url, content, type, created_at')
    .eq('workspace_id', workspaceId)
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
      // Keep the best similarity; first (highest-ranked) snippet wins.
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
