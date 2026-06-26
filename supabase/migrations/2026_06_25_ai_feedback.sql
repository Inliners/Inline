-- AI output feedback for prompt iteration (thumbs up/down on chat, insights, etc.)

create table if not exists public.ai_feedback (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  workspace_id  text not null default '',
  surface       text not null,
  target_id     text not null default '',
  rating        smallint not null check (rating in (-1, 1)),
  comment       text,
  created_at    timestamptz not null default now()
);

create index if not exists ai_feedback_user_workspace_idx
  on public.ai_feedback (user_id, workspace_id, created_at desc);

alter table public.ai_feedback enable row level security;

drop policy if exists "ai feedback is owner-only" on public.ai_feedback;
create policy "ai feedback is owner-only" on public.ai_feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
