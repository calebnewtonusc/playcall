-- 1. Fix picks RLS: users must NOT be able to update scoring columns
-- Drop the broad update policy and replace with a restricted one
drop policy if exists "picks_update_own" on public.picks;

-- Users can only update predicted_winner (change their pick) before game starts
-- Scoring columns (is_correct, accuracy_points, boldness_multiplier, streak_bonus, total_points)
-- are only writable by service role (via score_pick function which is SECURITY DEFINER)
create policy "picks_update_own" on public.picks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Add a trigger to block updates to scoring columns from non-service roles
create or replace function public.prevent_pick_score_tampering()
returns trigger as $$
begin
  if current_setting('role') != 'service_role' then
    -- Revert any changes to scoring columns
    new.is_correct := old.is_correct;
    new.accuracy_points := old.accuracy_points;
    new.boldness_multiplier := old.boldness_multiplier;
    new.streak_bonus := old.streak_bonus;
    new.total_points := old.total_points;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_pick_scores on public.picks;
create trigger protect_pick_scores
  before update on public.picks
  for each row execute function public.prevent_pick_score_tampering();

-- 2. Make score_pick() idempotent: don't re-score already-scored picks
create or replace function public.score_pick(pick_id uuid)
returns void as $$
declare
  v_pick public.picks%rowtype;
  v_game public.games%rowtype;
  v_stats public.user_stats%rowtype;
  v_accuracy_pts integer := 0;
  v_boldness_mult float := 1.0;
  v_streak_bonus integer := 0;
  v_total integer := 0;
  v_win_prob float;
begin
  select * into v_pick from public.picks where id = pick_id;

  -- Idempotency: skip if already scored
  if v_pick.is_correct is not null then
    return;
  end if;

  select * into v_game from public.games where id = v_pick.game_id;

  -- Only score if game is finished and has a winner
  if v_game.status != 'finished' or v_game.winner is null then
    return;
  end if;

  select * into v_stats from public.user_stats where user_id = v_pick.user_id;

  if v_game.winner = v_pick.predicted_winner then
    v_pick.is_correct := true;
    v_accuracy_pts := 10;

    if v_pick.predicted_winner = 'home' then
      v_win_prob := coalesce(v_game.home_win_probability, 0.5);
    else
      v_win_prob := coalesce(v_game.away_win_probability, 0.5);
    end if;
    v_boldness_mult := 1.0 + (1.0 - v_win_prob) * 2.0;

    v_stats.current_streak := coalesce(v_stats.current_streak, 0) + 1;
    if v_stats.current_streak >= 10 then v_streak_bonus := 50;
    elsif v_stats.current_streak >= 5 then v_streak_bonus := 15;
    elsif v_stats.current_streak >= 3 then v_streak_bonus := 5;
    end if;

    if v_stats.current_streak > coalesce(v_stats.longest_streak, 0) then
      v_stats.longest_streak := v_stats.current_streak;
    end if;
  else
    v_pick.is_correct := false;
    v_stats.current_streak := 0;
  end if;

  v_total := round(v_accuracy_pts * v_boldness_mult) + v_streak_bonus;

  update public.picks set
    is_correct = v_pick.is_correct,
    accuracy_points = v_accuracy_pts,
    boldness_multiplier = v_boldness_mult,
    streak_bonus = v_streak_bonus,
    total_points = v_total
  where id = pick_id;

  update public.user_stats set
    total_picks = coalesce(total_picks, 0) + 1,
    correct_picks = coalesce(correct_picks, 0) + (case when v_pick.is_correct then 1 else 0 end),
    current_streak = v_stats.current_streak,
    longest_streak = v_stats.longest_streak,
    total_points = coalesce(total_points, 0) + v_total,
    accuracy_points = coalesce(accuracy_points, 0) + v_accuracy_pts,
    boldness_points = coalesce(boldness_points, 0) + round(v_accuracy_pts * v_boldness_mult) - v_accuracy_pts,
    streak_bonus_points = coalesce(streak_bonus_points, 0) + v_streak_bonus,
    updated_at = now()
  where user_id = v_pick.user_id;
end;
$$ language plpgsql security definer;

-- 3. Performance indexes
create index if not exists idx_games_status on public.games(status);
create index if not exists idx_games_start_time on public.games(start_time);
create index if not exists idx_picks_user_id on public.picks(user_id);
create index if not exists idx_picks_game_id on public.picks(game_id);
create index if not exists idx_user_stats_total_points on public.user_stats(total_points desc);
create index if not exists idx_user_stats_correct_picks on public.user_stats(correct_picks desc);
create index if not exists idx_user_stats_streak on public.user_stats(current_streak desc);

-- 4. Add username length constraint (idempotent via DO block)
do $$ begin
  alter table public.profiles add constraint username_length check (char_length(username) between 3 and 30);
exception when duplicate_object then null;
end $$;

-- 5. Add constraint to prevent probability values outside 0-1 (idempotent via DO block)
do $$ begin
  alter table public.games add constraint home_prob_range check (home_win_probability is null or (home_win_probability >= 0 and home_win_probability <= 1));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.games add constraint away_prob_range check (away_win_probability is null or (away_win_probability >= 0 and away_win_probability <= 1));
exception when duplicate_object then null;
end $$;
