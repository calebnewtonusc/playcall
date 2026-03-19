-- Add computed accuracy_rate column to user_stats for efficient leaderboard sorting
-- This avoids client-side sorting on a potentially large dataset

alter table public.user_stats
  add column if not exists accuracy_rate float generated always as (
    case when total_picks > 0 then correct_picks::float / total_picks else 0 end
  ) stored;

-- Index for accuracy leaderboard tab
create index if not exists idx_user_stats_accuracy_rate on public.user_stats(accuracy_rate desc);

-- Min picks filter: only include users with >= 5 picks in accuracy leaderboard
create index if not exists idx_user_stats_accuracy_filtered
  on public.user_stats(accuracy_rate desc)
  where total_picks >= 5;
