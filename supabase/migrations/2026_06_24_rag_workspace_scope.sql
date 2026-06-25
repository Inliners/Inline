-- Broaden workspace embedding search to include legacy rows indexed with an empty
-- workspace_id (captures saved before workspace scoping was enforced).

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
    and (
      p_workspace_id is null
      or we.workspace_id = p_workspace_id
      or we.workspace_id = ''
    )
    and 1 - (we.embedding <=> query_embedding) >= match_threshold
  order by we.embedding <=> query_embedding
  limit greatest(1, least(match_count, 50));
$$;
