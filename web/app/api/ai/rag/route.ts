import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { NextResponse } from 'next/server'
import { getAIApiKey, getSupabaseAndUserFromRequest } from '@/lib/ai-key'
import { INLINE_SYSTEM_CONTEXT } from '@/lib/inline-persona'
import {
  dedupeSources,
  fetchRecentNotes,
  formatSourcesForPrompt,
  MIN_DISPLAY_SIMILARITY,
  retrieveRelevantChunks,
  type RagSource,
} from '@/lib/ai/rag/retrieval'
import { ensureWorkspaceIndexed } from '@/lib/ai/rag/indexer'
import { safeSnippet } from '@/lib/ai/rag/text'

/**
 * POST /api/ai/rag — workspace research chat with real retrieval.
 *
 * Pipeline: embed the question → cosine search over workspace_embeddings
 * (RLS-scoped) → numbered source context → Gemini stream.
 *
 * Response format: the first line is a JSON metadata header
 *   { "sources": RagSource[], "mode": "semantic" | "recency" | "none" }
 * followed by "\n" and the plain-text answer stream. The chat panel renders
 * source cards only from this server-provided list, never from model output.
 *
 * Fallback: if vector search cannot run, recent notes are still used as context
 * but the client always receives mode "semantic" or "none".
 */

const MAX_MESSAGE_CHARS = 4000

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getSupabaseAndUserFromRequest(request)
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let message = '', workspaceId = '', libraryDocs: { title: string; content: string }[] = []
    try {
      const body = await request.json()
      message     = typeof body.message === 'string' ? body.message.slice(0, MAX_MESSAGE_CHARS) : ''
      workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : ''
      libraryDocs = Array.isArray(body.libraryDocs) ? body.libraryDocs.slice(0, 10) : []
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!message.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    const apiKey = await getAIApiKey()
    if (!apiKey) {
      return NextResponse.json({ error: 'No AI API key configured.' }, { status: 403 })
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const sb = supabase as any
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // ---- Index anything not yet embedded for this workspace ---------------
    if (workspaceId) {
      try {
        await ensureWorkspaceIndexed(sb, user.id, workspaceId, { maxBatches: 4, batchSize: 25 })
      } catch (err) {
        console.warn('[rag] ensureWorkspaceIndexed:', (err as Error)?.message)
      }
    }

    // ---- Retrieval -------------------------------------------------------
    const retrieval = await retrieveRelevantChunks(sb, workspaceId, message)

    let chunks = retrieval.chunks
    let usingRecency = false
    if (chunks.length === 0 && retrieval.mode === 'recency') {
      chunks = await fetchRecentNotes(sb, workspaceId)
      usingRecency = chunks.length > 0
    }

    const mode: 'semantic' | 'recency' | 'none' =
      retrieval.mode === 'semantic' && chunks.length > 0
        ? 'semantic'
        : usingRecency
          ? 'recency'
          : chunks.length > 0
            ? 'semantic'
            : 'none'

    const sources: RagSource[] = mode === 'semantic'
      ? dedupeSources(chunks).filter(
          s => s.similarity == null || s.similarity >= MIN_DISPLAY_SIMILARITY,
        )
      : []

    const contextBlock = mode === 'recency'
      ? chunks
          .map((chunk) => {
            const label = chunk.page_title || chunk.domain || chunk.source_type
            return `(recent capture — ${label})\n${chunk.chunk_text.slice(0, 1200)}`
          })
          .join('\n\n')
      : formatSourcesForPrompt(chunks, sources)

    // Client-side library docs (localStorage folders) are extra context but
    // are also surfaced as citable sources without links.
    const docSources: RagSource[] = libraryDocs
      .filter(d => d && typeof d.content === 'string' && d.content.trim())
      .map((d, i) => ({
        ref: sources.length + i + 1,
        sourceType: 'document',
        sourceId: `local-doc-${i}`,
        pageUrl: null,
        pageTitle: typeof d.title === 'string' && d.title ? d.title : 'Untitled document',
        domain: null,
        snippet: safeSnippet(d.content),
        similarity: null,
      }))
    const docsContext = libraryDocs
      .filter(d => d && typeof d.content === 'string' && d.content.trim())
      .map((d, i) => `[${sources.length + i + 1}] (document: ${d.title || 'Untitled'})\n${String(d.content).slice(0, 1200)}`)
      .join('\n\n')

    const allSources = [...sources, ...docSources]

    // ---- Prompt ----------------------------------------------------------
    const retrievalNote =
      mode === 'semantic'
        ? 'The numbered sources below were retrieved from this workspace (semantic search over saved captures and documents).'
        : mode === 'recency'
          ? 'Recent captures are included as background context only — they are not numbered sources. Do not cite [n] unless semantic sources are listed.'
          : 'No captures or documents were found for this workspace.'

    const systemPrompt = `${INLINE_SYSTEM_CONTEXT}

# Workspace context for this conversation
The user is chatting from workspace "${workspaceId || 'unknown'}". ${retrievalNote}

# Citation rules (strict)
- Cite a source inline as [n] ONLY when n appears in the numbered sources below. Never invent a source number, title, or quote.
- Use at most one citation per bullet or sentence — never comma-separated lists like [1, 2, 3] or [1, 2, 3, 4, 5].
- When listing websites or domains, use one bullet per unique domain. Omit inline citations on list items when possible — source cards appear below the answer.
- If the sources do not contain the answer, say so plainly and answer from general knowledge only when clearly labeled as such.
- General questions about Inline itself ("what are you?", "what can you do?", "how do I use Inline?") can be answered from the identity context above without citations.

# Response format
- Conversational plain text. Use "- " bullet lines when listing multiple items.
- No markdown bold, asterisks, hashes, or headings.
- Keep answers short unless the user asks for detail. Group related captures instead of dumping every source number.

${contextBlock ? (mode === 'recency' ? `# Recent captures (background only — do not cite)\n${contextBlock}` : `# Retrieved sources\n${contextBlock}`) : '# Retrieved sources\n(none — the workspace has no matching captures)'}

${docsContext ? `# Library documents provided by the user\n${docsContext}` : ''}`

    const google = createGoogleGenerativeAI({ apiKey })
    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    })

    // ---- Stream: JSON metadata header line, then plain text ---------------
    const encoder = new TextEncoder()
    const header = JSON.stringify({ sources: allSources, mode }) + '\n'

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(header))
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        } catch (err: unknown) {
          const status = (err as { statusCode?: number })?.statusCode
          const body = (err as { responseBody?: string })?.responseBody ?? ''
          let msg = 'The AI service failed to respond. Please try again shortly.'
          if (status === 429) {
            msg = 'The AI quota for this workspace is exhausted. Please try again later or check the server AI key billing.'
          } else if (status === 403) {
            msg = 'The AI provider rejected the request. The server API key may be restricted.'
          } else if (status === 400 && body.includes('API key not valid')) {
            msg = 'The server AI key is not valid. Ask the administrator to update GOOGLE_GENERATIVE_AI_API_KEY.'
          } else if (status === 404) {
            msg = 'The AI model is unavailable on this server key. Ask the administrator to update the model configuration.'
          }
          console.error('[rag] stream error:', status, body.slice(0, 300))
          controller.enqueue(encoder.encode(msg))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Inline-Rag-Mode': mode,
      },
    })
  } catch (err: unknown) {
    console.error('[rag] Error:', (err as Error)?.message)
    const status = (err as { statusCode?: number }).statusCode
    if (status === 429) {
      return NextResponse.json(
        { error: 'AI quota exhausted — please try again later.' },
        { status: 429 },
      )
    }
    return NextResponse.json({ error: 'AI request failed.' }, { status: 500 })
  }
}
