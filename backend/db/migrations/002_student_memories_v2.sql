-- ═══════════════════════════════════════════════════════════════════
-- Migration 003: student_memories v2
--
-- Fixes from v1 (002_student_memories.sql):
--   1. Removes the `user_id UUID FK` column — Mem0 doesn't populate it;
--      user isolation is done via metadata->>'user_id' instead.
--   2. Corrects RLS policy to use metadata-based user check.
--   3. Changes embedding dims from 1536 (OpenAI ada-002) to 768
--      (Google text-embedding-004) — no external embedding API needed.
--   4. Renames the search function to `match_vectors` (Mem0 default name).
--   5. Adds category + valid_until indexes for TTL-based pruning.
--
-- Run BEFORE deploying memory/__init__.py v2.
-- Apply in Supabase SQL editor (service role).
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Drop old table + index + function from migration 002 if present
drop function if exists match_student_memories cascade;
drop index if exists student_memories_embedding_idx;
drop index if exists student_memories_user_idx;
drop index if exists student_memories_meta_idx;
drop table if exists student_memories cascade;

-- Step 2: Re-create with correct schema
--   - NO user_id FK column (Mem0 stores this in metadata->>'user_id')
--   - vector(768) for Google text-embedding-004
create table student_memories (
    id          text        primary key,                       -- UUID from Mem0
    embedding   vector(768),                                   -- Google 768-dim embeddings
    metadata    jsonb       not null default '{}'::jsonb,      -- user_id, category, valid_until, source, facts here
    created_at  timestamptz not null default timezone('utc', now()),
    updated_at  timestamptz not null default timezone('utc', now())
);

-- Step 3: HNSW index for vector similarity search (cosine)
create index student_memories_embedding_idx
    on student_memories
    using hnsw (embedding vector_cosine_ops)
    with (m = 16, ef_construction = 64);

-- Step 4: GIN index on metadata for fast category + user filtering
create index student_memories_meta_gin_idx
    on student_memories using gin (metadata jsonb_path_ops);

-- Step 5: B-tree index for TTL pruning queries
create index student_memories_valid_until_idx
    on student_memories ((metadata->>'valid_until'));

-- Step 6: RLS — user_id is inside metadata JSONB, not a FK column
alter table student_memories enable row level security;

-- Students read only their own memories (via REST API with anon key)
create policy "Users read own memories"
    on student_memories for select
    using ((metadata->>'user_id')::uuid = auth.uid());

-- Full access for service role (used by backend + scheduler)
create policy "Service role full access"
    on student_memories for all
    using (auth.role() = 'service_role');

-- Step 7: match_vectors — named exactly as Mem0 expects for Supabase provider
--   Accepts filter JSONB so we can filter by user_id or category at query time
create or replace function match_vectors(
    query_embedding vector(768),
    match_count     int,
    filter          jsonb default '{}'::jsonb
)
returns table (
    id          text,
    similarity  float,
    metadata    jsonb
)
language plpgsql
security definer                -- runs as owner, bypasses RLS for internal search
as $$
begin
    return query
    select
        m.id::text,
        1 - (m.embedding <=> query_embedding) as similarity,
        m.metadata
    from student_memories m
    where
        -- TTL filter: skip expired memories
        (
            m.metadata->>'valid_until' is null
            or (m.metadata->>'valid_until')::timestamptz > now()
        )
        and (
            -- apply user/category filter from Mem0 if provided
            case
                when filter::text = '{}'::text then true
                else m.metadata @> filter
            end
        )
    order by m.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- Step 8: Auto update_at trigger (same as v1)
create or replace function _set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

create trigger student_memories_updated_at
    before update on student_memories
    for each row execute procedure _set_updated_at();
