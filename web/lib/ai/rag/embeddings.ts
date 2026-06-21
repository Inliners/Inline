import { embed, embedMany } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { getAIApiKey } from '@/lib/ai-key'

/**
 * Server-only embedding helpers. Gemini text-embedding-004, 768 dimensions —
 * must match vector(768) in supabase/migrations/2026_06_12_pgvector_rag.sql.
 */

export const EMBEDDING_MODEL = 'text-embedding-004'
export const EMBEDDING_DIMENSIONS = 768

async function embeddingModel() {
  const apiKey = await getAIApiKey()
  if (!apiKey) return null
  const google = createGoogleGenerativeAI({ apiKey })
  return google.textEmbedding(EMBEDDING_MODEL)
}

/** Embed a single string (used for queries). Returns null if no AI key. */
export async function embedText(text: string): Promise<number[] | null> {
  const model = await embeddingModel()
  if (!model) return null
  const { embedding } = await embed({ model, value: text.slice(0, 8000) })
  return embedding
}

/** Embed a batch of chunk texts. Returns null if no AI key. */
export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  if (texts.length === 0) return []
  const model = await embeddingModel()
  if (!model) return null
  const { embeddings } = await embedMany({
    model,
    values: texts.map(t => t.slice(0, 8000)),
  })
  return embeddings
}
