export type Sport = 'NFL' | 'NBA' | 'Soccer'
export type GameStatus = 'upcoming' | 'live' | 'finished'
export type Winner = 'home' | 'away' | 'draw'
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Game {
  id: string
  sport: Sport
  home_team: string
  away_team: string
  home_logo_url: string | null
  away_logo_url: string | null
  start_time: string
  status: GameStatus
  winner: Winner | null
  home_win_probability: number | null
  away_win_probability: number | null
}

export interface Pick {
  id: string
  user_id: string
  game_id: string
  predicted_winner: Winner
  is_correct: boolean | null
  accuracy_points: number
  boldness_multiplier: number
  streak_bonus: number
  total_points: number
  created_at: string
}

export interface UserStats {
  user_id: string
  total_picks: number
  correct_picks: number
  current_streak: number
  longest_streak: number
  total_points: number
  accuracy_points: number
  boldness_points: number
  streak_bonus_points: number
}

export interface LeaderboardEntry {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  total_points: number
  correct_picks: number
  total_picks: number
  current_streak: number
  rank: number
}
