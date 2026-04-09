create extension if not exists pgcrypto;

create table if not exists public.leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  score integer not null,
  level integer not null,
  lines integer not null,
  created_at timestamptz not null default now(),
  constraint leaderboard_scores_name_check
    check (name ~ '^[A-Z0-9 ]{1,12}$'),
  constraint leaderboard_scores_score_check
    check (score between 0 and 99999999),
  constraint leaderboard_scores_level_check
    check (level between 1 and 999),
  constraint leaderboard_scores_lines_check
    check (lines between 0 and 9999)
);

create index if not exists leaderboard_scores_rank_idx
  on public.leaderboard_scores (score desc, level desc, lines desc, created_at asc);

alter table public.leaderboard_scores enable row level security;

drop policy if exists "public leaderboard read" on public.leaderboard_scores;
create policy "public leaderboard read"
  on public.leaderboard_scores
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public leaderboard insert" on public.leaderboard_scores;
create policy "public leaderboard insert"
  on public.leaderboard_scores
  for insert
  to anon, authenticated
  with check (
    name ~ '^[A-Z0-9 ]{1,12}$'
    and score between 0 and 99999999
    and level between 1 and 999
    and lines between 0 and 9999
  );
