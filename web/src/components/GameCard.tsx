'use client'
import { Game, Pick, Winner } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

interface Props {
  game: Game
  existingPick?: Pick
  onPick: (gameId: string, winner: Winner) => void
  loading: boolean
}

const SPORT_EMOJI: Record<string, string> = { NFL: '🏈', NBA: '🏀', Soccer: '⚽' }

function getBoldnessLabel(prob: number): string {
  if (prob < 0.3) return 'BOLD PICK'
  if (prob < 0.45) return 'UNDERDOG'
  return ''
}

function getTimeLabel(game: Game): string {
  if (game.status === 'finished') return 'Final'
  if (game.status === 'live') return 'Live'
  const start = new Date(game.start_time)
  if (start < new Date()) return 'In progress'
  return `Starts ${formatDistanceToNow(start, { addSuffix: true })}`
}

export default function GameCard({ game, existingPick, onPick, loading }: Props) {
  const isFinished = game.status === 'finished'
  const canPick = game.status === 'upcoming' && new Date(game.start_time) > new Date() && !existingPick

  const homeBoldness = game.home_win_probability ? getBoldnessLabel(game.home_win_probability) : ''
  const awayBoldness = game.away_win_probability ? getBoldnessLabel(game.away_win_probability) : ''

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
          {SPORT_EMOJI[game.sport]} {game.sport}
        </span>
        <span className="text-xs text-white/40">{getTimeLabel(game)}</span>
      </div>

      <div className="grid grid-cols-3 items-center gap-4">
        <div className="text-center">
          <p className="text-white font-semibold text-sm leading-tight">{game.home_team}</p>
          {game.home_win_probability != null && (
            <p className="text-xs text-white/30 mt-1">{Math.round(game.home_win_probability * 100)}%</p>
          )}
          {homeBoldness && (
            <span className="inline-block mt-1 text-xs font-bold text-amber-400">{homeBoldness}</span>
          )}
        </div>

        <div className="text-center text-white/20 font-bold text-sm">VS</div>

        <div className="text-center">
          <p className="text-white font-semibold text-sm leading-tight">{game.away_team}</p>
          {game.away_win_probability != null && (
            <p className="text-xs text-white/30 mt-1">{Math.round(game.away_win_probability * 100)}%</p>
          )}
          {awayBoldness && (
            <span className="inline-block mt-1 text-xs font-bold text-amber-400">{awayBoldness}</span>
          )}
        </div>
      </div>

      {canPick && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => onPick(game.id, 'home')}
            disabled={loading}
            className="py-2 bg-sky-500/20 hover:bg-sky-500/40 border border-sky-500/30 text-sky-300 rounded-xl text-sm font-medium transition disabled:opacity-50 truncate px-2"
          >
            {game.home_team}
          </button>
          <button
            onClick={() => onPick(game.id, 'away')}
            disabled={loading}
            className="py-2 bg-sky-500/20 hover:bg-sky-500/40 border border-sky-500/30 text-sky-300 rounded-xl text-sm font-medium transition disabled:opacity-50 truncate px-2"
          >
            {game.away_team}
          </button>
        </div>
      )}

      {existingPick && (
        <div className={clsx(
          'mt-4 px-4 py-2 rounded-xl text-sm font-medium text-center',
          existingPick.is_correct === true ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
          existingPick.is_correct === false ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
          'bg-white/5 text-white/50 border border-white/10'
        )}>
          {existingPick.is_correct === true && `Correct! +${existingPick.total_points} pts`}
          {existingPick.is_correct === false && 'Wrong pick'}
          {existingPick.is_correct === null && `Picked: ${existingPick.predicted_winner === 'home' ? game.home_team : game.away_team}`}
        </div>
      )}

      {isFinished && game.winner && !existingPick && (
        <div className="mt-4 text-center text-xs text-white/30">
          Winner: {game.winner === 'home' ? game.home_team : game.away_team}
        </div>
      )}
    </div>
  )
}
