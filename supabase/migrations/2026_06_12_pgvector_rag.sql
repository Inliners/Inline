-- Real RAG storage for Inline.
-- Run this in the Supabase SQL editor (or `supabase db push`) before using
-- semantic retrieval. Until it runs, /api/ai/rag falls back to recency mode
-- and the chat panel labels answers as "recent activity".

-- 1. pgvector ------------------------------------------------------------
-- Supabase installs pgvector into the `extensions` schema; functions that use
-- vector operators (<=>, etc.) must include that schema on search_path.
create extension if not exists vector with schema extensions;

-- 2. Unified chunk store for notes / documents / recaps / pages ----------
create table if not exists public.workspace_embeddings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  workspace_id text not null default '',
  source_type  text not null check (source_type in ('note', 'document', 'page', 'recap', 'annotation')),
  source_id    text not null,
  page_url     text,
  page_title   text,
  domain       text,
  chunk_text   text not null,
  chunk_index  int  not null default 0,
  metadata     jsonb not null default '{}'::jsonb,
  embedding    extensions.vector(768) not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- One row per (owner, source, chunk position) so re-indexing can upsert.
create unique index if not exists workspace_embeddings_source_chunk_idx
  on public.workspace_embeddings (user_id, source_type, source_id, chunk_index);

create index if not exists workspace_embeddings_workspace_idx
  on public.workspace_embeddings (user_id, workspace_id);

-- ANN index for cosine similarity search.
create index if not exists workspace_embeddings_embedding_idx
  on public.workspace_embeddings
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100);

-- 3. RLS: strictly owner-scoped ------------------------------------------
alter table public.workspace_embeddings enable row level security;

drop policy if exists "workspace embeddings are owner-only" on public.workspace_embeddings;
create policy "workspace embeddings are owner-only" on public.workspace_embeddings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4. Similarity search RPC ------------------------------------------------
-- security invoker: RLS applies, and the explicit auth.uid() filter keeps the
-- function safe even if it is later switched to definer.
create or replace function public.match_workspace_embeddings(
  query_embedding extensions.vector(768),
  p_workspace_id  text  default null,
  match_count     int   default 12,
  match_threshold float default 0.5
)
returns table (
  id          uuid,
  source_type text,
  source_id   text,
  page_url    text,
  page_title  text,
  domain      text,
  chunk_text  text,
  chunk_index int,
  metadata    jsonb,
  similarity  float
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    we.id,
    we.source_type,
    we.source_id,
    we.page_url,
    we.page_title,
    we.domain,
    we.chunk_text,
    we.chunk_index,
    we.metadata,
    1 - (we.embedding <=> query_embedding) as similarity
  from public.workspace_embeddings we
  where we.user_id = auth.uid()
    and (p_workspace_id is null or we.workspace_id = p_workspace_id)
    and 1 - (we.embedding <=> query_embedding) >= match_threshold
  order by we.embedding <=> query_embedding
  limit greatest(1, least(match_count, 50));
$$;
