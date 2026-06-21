-- Schema drift fixes discovered during the production-polish audit.
-- All statements are idempotent and safe to run on existing projects.

-- 1. The Express annotation mirror stores the extension-generated item id in
--    notes.anchor_id (the 2026_04_17 migration defined external_id instead).
--    Add the column the code actually uses so deletes/diffs match rows.
alter table public.notes
  add column if not exists anchor_id text;

create index if not exists notes_user_page_anchor_idx
  on public.notes (user_id, page_url, anchor_id)
  where anchor_id is not null;

-- 2. /api/ai/page-recap upserts documents with folder_id = 'auto-recaps',
--    which was missing from the original documents DDL.
alter table public.documents
  add column if not exists folder_id text;

-- 3. The workspace activity feed filters extractions by workspace_id.
alter table public.extractions
  add column if not exists workspace_id text;
