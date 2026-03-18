-- Sample games for testing
insert into public.games (sport, home_team, away_team, start_time, status, home_win_probability, away_win_probability) values
('NBA', 'Los Angeles Lakers', 'Golden State Warriors', now() + interval '2 hours', 'upcoming', 0.55, 0.45),
('NBA', 'Boston Celtics', 'Miami Heat', now() + interval '4 hours', 'upcoming', 0.62, 0.38),
('NFL', 'Kansas City Chiefs', 'San Francisco 49ers', now() + interval '6 hours', 'upcoming', 0.58, 0.42),
('Soccer', 'Manchester City', 'Arsenal', now() + interval '8 hours', 'upcoming', 0.48, 0.40),
('NBA', 'Denver Nuggets', 'Phoenix Suns', now() + interval '24 hours', 'upcoming', 0.60, 0.40);
