import { LeaderboardEntry } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  entry: LeaderboardEntry
  isCurrentUser: boolean
}

const RANK_COLORS: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-slate-300',
  3: 'text-amber-600',
}

export default function LeaderboardRow({ entry, isCurrentUser }: Props) {
  const accuracy = entry.total_picks > 0
    ? Math.round((entry.correct_picks / entry.total_picks) * 100)
    : 0

  return (
    <div className={clsx(
      'flex items-center gap-4 px-5 py-4 rounded-xl border transition',
      isCurrentUser
        ? 'bg-sky-500/10 border-sky-500/30'
        : 'bg-white/5 border-white/10 hover:border-white/20'
    )}>
      <span className={clsx('w-6 text-center font-bold text-sm', RANK_COLORS[entry.rank] || 'text-white/40')}>
        {entry.rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className={clsx('font-semibold text-sm truncate', isCurrentUser ? 'text-sky-300' : 'text-white')}>
          {entry.display_name || entry.username}
          {isCurrentUser && <span className="ml-2 text-xs text-sky-400/70">(you)</span>}
        </p>
        <p className="text-xs text-white/30">@{entry.username}</p>
      </div>
      <div className="text-right">
        <p className="text-white font-bold text-sm">{entry.total_points.toLocaleString()} pts</p>
        <p className="text-xs text-white/30">{accuracy}% accuracy</p>
      </div>
      {entry.current_streak > 0 && (
        <div className="text-right">
          <p className="text-amber-400 font-bold text-sm">{entry.current_streak}</p>
          <p className="text-xs text-white/30">streak</p>
        </div>
      )}
    </div>
  )
}
