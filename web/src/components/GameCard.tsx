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

export default function GameCard({ game, existingPick, onPick, loading }: Props) {
  const isPast = new Date(game.start_time) < new Date()
  const isFinished = game.status === 'finished'
  const canPick = !isPast && !existingPick && !isFinished

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
          {SPORT_EMOJI[game.sport]} {game.sport}
        </span>
        <span className="text-xs text-white/40">
          {isFinished
            ? 'Final'
            : isPast
            ? 'In progress'
            : `Starts ${formatDistanceToNow(new Date(game.start_time), { addSuffix: true })}`}
        </span>
      </div>

      <div className="grid grid-cols-3 items-center gap-4">
        {/* Home team */}
        <div className="text-center">
          <p className="text-white font-semibold text-sm leading-tight">{game.home_team}</p>
          {game.home_win_probability && (
            <p className="text-xs text-white/30 mt-1">{Math.round(game.home_win_probability * 100)}%</p>
          )}
          {game.home_win_probability && getBoldnessLabel(game.home_win_probability) && (
            <span className="inline-block mt-1 text-xs font-bold text-amber-400">
              {getBoldnessLabel(game.home_win_probability)}
            </span>
          )}
        </div>

        {/* VS */}
        <div className="text-center text-white/20 font-bold text-sm">VS</div>

        {/* Away team */}
        <div className="text-center">
          <p className="text-white font-semibold text-sm leading-tight">{game.away_team}</p>
          {game.away_win_probability && (
            <p className="text-xs text-white/30 mt-1">{Math.round(game.away_win_probability * 100)}%</p>
          )}
          {game.away_win_probability && getBoldnessLabel(game.away_win_probability) && (
            <span className="inline-block mt-1 text-xs font-bold text-amber-400">
              {getBoldnessLabel(game.away_win_probability)}
            </span>
          )}
        </div>
      </div>

      {/* Pick buttons */}
      {canPick && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => onPick(game.id, 'home')}
            disabled={loading}
            className="py-2 bg-sky-500/20 hover:bg-sky-500/40 border border-sky-500/30 text-sky-300 rounded-xl text-sm font-medium transition disabled:opacity-50"
          >
            {game.home_team.split(' ').slice(-1)[0]}
          </button>
          <button
            onClick={() => onPick(game.id, 'away')}
            disabled={loading}
            className="py-2 bg-sky-500/20 hover:bg-sky-500/40 border border-sky-500/30 text-sky-300 rounded-xl text-sm font-medium transition disabled:opacity-50"
          >
            {game.away_team.split(' ').slice(-1)[0]}
          </button>
        </div>
      )}

      {/* Existing pick */}
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

      {/* Winner display */}
      {isFinished && game.winner && !existingPick && (
        <div className="mt-4 text-center text-xs text-white/30">
          Winner: {game.winner === 'home' ? game.home_team : game.away_team}
        </div>
      )}
    </div>
  )
}
