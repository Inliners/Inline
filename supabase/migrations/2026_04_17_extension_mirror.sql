-- Optional migration for richer dashboards. Safe to paste into the Supabase
-- SQL editor. None of this is required — the extension mirror already works
-- against the current notes.type CHECK by mapping kinds down to
-- 'text' | 'canvas' | 'ai-summary' and storing the original kind in tags.
-- Run this if you want the type column itself to record every kind.

-- 1. Expand the type CHECK so the mirror can write each feature verbatim.
alter table public.notes
  drop constraint if exists notes_type_check;

alter table public.notes
  add constraint notes_type_check
  check (
    type = any (
      array[
        'text', 'canvas', 'ai-summary',
        'sticky', 'anchor', 'paper-note',
        'drawing', 'handwriting', 'highlight', 'stamp',
        'clip'
      ]
    )
  );

-- 2. Stable client-generated id for mirroring (lets upsert-on-conflict work).
alter table public.notes
  add column if not exists external_id text;

create unique index if not exists notes_user_workspace_external_idx
  on public.notes (user_id, coalesce(workspace_id, ''), external_id)
  where external_id is not null;

-- 3. Auto-generated page recap + library documents. Used by the Library /
-- History "View recap document" flow.
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id text,
  page_url text,
  title text not null default 'Untitled',
  content jsonb not null default '{}'::jsonb,
  markdown text,
  auto_generated boolean not null default false,
  recap_stale boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists documents_user_workspace_page_idx
  on public.documents (user_id, coalesce(workspace_id, ''), coalesce(page_url, ''))
  where page_url is not null;

alter table public.documents enable row level security;

drop policy if exists "documents are owner-only" on public.documents;
create policy "documents are owner-only" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
