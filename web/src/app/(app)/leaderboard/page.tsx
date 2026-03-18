'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LeaderboardRow from '@/components/LeaderboardRow'
import { LeaderboardEntry } from '@/lib/types'

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<'total' | 'accuracy' | 'streak'>('total')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      const { data } = await supabase
        .from('user_stats')
        .select('*, profiles!inner(username, display_name, avatar_url)')
        .order(tab === 'total' ? 'total_points' : tab === 'accuracy' ? 'correct_picks' : 'current_streak', { ascending: false })
        .limit(50)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: LeaderboardEntry[] = (data || []).map((row: any, i: number) => ({
        user_id: row.user_id,
        username: row.profiles.username,
        display_name: row.profiles.display_name,
        avatar_url: row.profiles.avatar_url,
        total_points: row.total_points,
        correct_picks: row.correct_picks,
        total_picks: row.total_picks,
        current_streak: row.current_streak,
        rank: i + 1,
      }))

      setEntries(mapped)
      setLoading(false)
    }
    fetchLeaderboard()
  }, [tab])

  const tabs = [
    { key: 'total' as const, label: 'Total Points' },
    { key: 'accuracy' as const, label: 'Accuracy' },
    { key: 'streak' as const, label: 'Streaks' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-white/40 text-sm">Top pickers this season</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              tab === t.key ? 'bg-sky-500 text-white' : 'text-white/40 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <LeaderboardRow
              key={entry.user_id}
              entry={entry}
              isCurrentUser={entry.user_id === currentUserId}
            />
          ))}
          {entries.length === 0 && (
            <div className="text-center py-16 text-white/30">No entries yet. Be the first!</div>
          )}
        </div>
      )}
    </div>
  )
}
