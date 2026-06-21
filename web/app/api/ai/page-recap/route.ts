import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getAIApiKey, getSupabaseAndUserFromRequest } from '@/lib/ai-key'
import { INLINE_SHORT_PERSONA } from '@/lib/inline-persona'
import { indexDocumentById } from '@/lib/ai/rag/indexer'

/**
 * POST /api/ai/page-recap
 *
 * Composes a structured markdown recap document for every note + extraction
 * captured on a specific page_url within a workspace, and upserts the result
 * into public.documents.
 *
 * Body: { workspaceId: string, pageUrl: string }
 */
export async function POST(request: Request) {
  const { user, supabase } = await getSupabaseAndUserFromRequest(request)
  if (!user || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let workspaceId = '', pageUrl = ''
  try {
    const body = await request.json()
    workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : ''
    pageUrl     = typeof body.pageUrl     === 'string' ? body.pageUrl     : ''
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!pageUrl) return NextResponse.json({ error: 'pageUrl required' }, { status: 400 })

  type NoteRow = {
    id: string
    type: string
    page_title: string | null
    content: string | null
    page_url: string | null
    domain: string | null
    created_at: string
    updated_at: string | null
  }

  const sb = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (c: string, v: string) => {
          eq: (c: string, v: string) => {
            eq: (c: string, v: string) => {
              order: (c: string, o: { ascending: boolean }) => Promise<{ data: NoteRow[] | null; error: unknown }>
            }
          }
        }
      }
      upsert: (row: Record<string, unknown>, opts?: { onConflict?: string }) => {
        select: () => {
          maybeSingle: () => Promise<{ data: unknown; error: unknown }>
        }
      }
    }
  }

  const { data: notesRaw } = await sb
    .from('notes')
    .select('id, type, page_title, content, page_url, domain, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .eq('page_url', pageUrl)
    .order('created_at', { ascending: true })

  const notes: NoteRow[] = Array.isArray(notesRaw) ? notesRaw : []

  if (notes.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'no activity' })
  }

  const pageTitle = notes.find(n => n.page_title && !/^\s*$/.test(n.page_title))?.page_title
    ?? (() => { try { return new URL(pageUrl).hostname } catch { return pageUrl } })()

  const grouped: Record<string, NoteRow[]> = {}
  for (const n of notes) {
    (grouped[n.type] = grouped[n.type] ?? []).push(n)
  }

  const TYPE_HEADINGS: Record<string, string> = {
    clip: 'Clips',
    highlight: 'Highlights',
    sticky: 'Sticky notes',
    'paper-note': 'Paper notes',
    anchor: 'Anchor notes',
    drawing: 'Drawings',
    handwriting: 'Handwriting',
    stamp: 'Stamps',
    'ai-summary': 'AI summaries',
    text: 'Text',
    canvas: 'Canvas',
  }

  const typeOrder = [
    'ai-summary', 'clip', 'highlight', 'sticky', 'paper-note',
    'anchor', 'drawing', 'handwriting', 'stamp', 'text', 'canvas',
  ]

  const sourceSnippet = (items: NoteRow[]) => items.slice(0, 30).map((n) => {
    const body = (n.content ?? '').trim().slice(0, 300)
    return `- ${body || '(no content)'}`
  }).join('\n')

  const aggregateForAi = typeOrder
    .filter(t => grouped[t]?.length)
    .map(t => `### ${TYPE_HEADINGS[t] ?? t}\n${sourceSnippet(grouped[t])}`)
    .join('\n\n')

  const apiKey = await getAIApiKey()

  let summary = ''
  if (apiKey) {
    try {
      const google = createGoogleGenerativeAI({ apiKey })
      const model = google('gemini-2.5-flash')
      const prompt = [
        `You are composing a clean recap document for this page: ${pageTitle} (${pageUrl}).`,
        '',
        'Write a short "Overview" paragraph (3–5 sentences) describing what the user captured.',
        'Then write "Key insights" as 3–6 concise bullet points.',
        'Do NOT invent content not present below.',
        '',
        aggregateForAi,
      ].join('\n').slice(0, 16000)
      const { text } = await generateText({
        model,
        system: INLINE_SHORT_PERSONA,
        prompt,
      })
      summary = text.trim()
    } catch (err) {
      console.warn('[page-recap] AI summary failed:', (err as Error)?.message)
    }
  }

  const now = new Date().toISOString()
  const sections = typeOrder
    .filter(t => grouped[t]?.length)
    .map((t) => {
      const heading = TYPE_HEADINGS[t] ?? t
      const rows = grouped[t].map((n) => {
        const body = (n.content ?? '').trim()
        const stamp = new Date(n.updated_at ?? n.created_at).toLocaleString()
        const bullet = body ? body.replace(/\n+/g, ' ').slice(0, 500) : '_empty_'
        return `- **${stamp}** — ${bullet}`
      }).join('\n')
      return `## ${heading}\n\n${rows}`
    })
    .join('\n\n')

  let domain: string
  try { domain = new URL(pageUrl).hostname } catch { domain = '' }

  const header = [
    `# ${pageTitle}`,
    '',
    `_Auto-generated recap • ${domain}_`,
    `[Open page ↗](${pageUrl})`,
    '',
    summary ? `## Overview\n\n${summary}` : '',
  ].filter(Boolean).join('\n')

  const content = [header, sections].filter(Boolean).join('\n\n')

  const { data: upserted, error: upsertErr } = await sb
    .from('documents')
    .upsert(
      {
        user_id: user.id,
        workspace_id: workspaceId,
        folder_id: 'auto-recaps',
        title: pageTitle,
        content,
        page_url: pageUrl,
        auto_generated: true,
        recap_stale: false,
        updated_at: now,
      },
      { onConflict: 'user_id,workspace_id,page_url' },
    )
    .select()
    .maybeSingle()

  if (upsertErr) {
    console.error('[page-recap] upsert error:', upsertErr)
    return NextResponse.json({ error: 'Failed to upsert document' }, { status: 500 })
  }

  // Embed the recap document for RAG after responding. The page's individual
  // notes are indexed separately via /api/ai/index (triggered by the Express
  // mirror) so we don't double-embed them here.
  const recapId = (upserted as { id?: string } | null)?.id
  if (recapId) {
    after(async () => {
      try {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        await indexDocumentById(supabase as any, user.id, recapId)
        /* eslint-enable @typescript-eslint/no-explicit-any */
      } catch (err) {
        console.warn('[page-recap] indexing failed:', (err as Error)?.message)
      }
    })
  }

  return NextResponse.json({ ok: true, document: upserted })
}
