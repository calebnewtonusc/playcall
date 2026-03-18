-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Sports games
create table public.games (
  id uuid default uuid_generate_v4() primary key,
  sport text not null check (sport in ('NFL', 'NBA', 'Soccer')),
  home_team text not null,
  away_team text not null,
  home_logo_url text,
  away_logo_url text,
  start_time timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'finished')),
  winner text check (winner in ('home', 'away', 'draw')),
  home_win_probability float, -- 0-1, used for boldness multiplier
  away_win_probability float,
  created_at timestamptz default now() not null
);

-- User picks
create table public.picks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  game_id uuid references public.games(id) on delete cascade not null,
  predicted_winner text not null check (predicted_winner in ('home', 'away', 'draw')),
  is_correct boolean, -- null until game finishes
  accuracy_points integer default 0,
  boldness_multiplier float default 1.0,
  streak_bonus integer default 0,
  total_points integer default 0,
  created_at timestamptz default now() not null,
  unique(user_id, game_id)
);

-- User stats (denormalized for performance)
create table public.user_stats (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  total_picks integer default 0,
  correct_picks integer default 0,
  current_streak integer default 0,
  longest_streak integer default 0,
  total_points integer default 0,
  accuracy_points integer default 0,
  boldness_points integer default 0,
  streak_bonus_points integer default 0,
  updated_at timestamptz default now() not null
);

-- Friendships
create table public.friendships (
  id uuid default uuid_generate_v4() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  addressee_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz default now() not null,
  unique(requester_id, addressee_id)
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.picks enable row level security;
alter table public.user_stats enable row level security;
alter table public.friendships enable row level security;

-- Profiles: users can read all, only update own
create policy "profiles_read_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Games: everyone can read
create policy "games_read_all" on public.games for select using (true);

-- Picks: read own + friends, insert/update own only
create policy "picks_read_own" on public.picks for select using (auth.uid() = user_id);
create policy "picks_insert_own" on public.picks for insert with check (auth.uid() = user_id);
create policy "picks_update_own" on public.picks for update using (auth.uid() = user_id);

-- User stats: public read
create policy "stats_read_all" on public.user_stats for select using (true);
create policy "stats_update_own" on public.user_stats for update using (auth.uid() = user_id);
create policy "stats_insert_own" on public.user_stats for insert with check (auth.uid() = user_id);

-- Friendships: read own
create policy "friendships_read_own" on public.friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friendships_insert_own" on public.friendships for insert with check (auth.uid() = requester_id);
create policy "friendships_update_own" on public.friendships for update using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Auto-create profile + stats on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.user_stats (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to calculate and update pick scores after game finishes
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
  select * into v_game from public.games where id = v_pick.game_id;
  select * into v_stats from public.user_stats where user_id = v_pick.user_id;

  -- Check correctness
  if v_game.winner = v_pick.predicted_winner then
    v_pick.is_correct := true;
    v_accuracy_pts := 10;

    -- Boldness multiplier: underdog picks get higher multiplier
    if v_pick.predicted_winner = 'home' then
      v_win_prob := coalesce(v_game.home_win_probability, 0.5);
    else
      v_win_prob := coalesce(v_game.away_win_probability, 0.5);
    end if;
    -- Lower probability = bolder = higher multiplier (max 3x for 10% chance)
    v_boldness_mult := 1.0 + (1.0 - v_win_prob) * 2.0;

    -- Streak bonus
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

  -- Update pick
  update public.picks set
    is_correct = v_pick.is_correct,
    accuracy_points = v_accuracy_pts,
    boldness_multiplier = v_boldness_mult,
    streak_bonus = v_streak_bonus,
    total_points = v_total
  where id = pick_id;

  -- Update user stats
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
