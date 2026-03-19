'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, UserStats } from '@/lib/types'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const [{ data: profileData }, { data: statsData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
      ])

      setProfile(profileData)
      setStats(statsData)
      setLoading(false)
    }
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const accuracy = stats && stats.total_picks > 0
    ? Math.round((stats.correct_picks / stats.total_picks) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center text-2xl font-bold text-sky-400">
          {profile?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{profile?.display_name || profile?.username}</h1>
          <p className="text-white/40">@{profile?.username}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total Points', value: stats?.total_points?.toLocaleString() || '0' },
          { label: 'Accuracy', value: `${accuracy}%` },
          { label: 'Current Streak', value: `${stats?.current_streak || 0} 🔥` },
          { label: 'Best Streak', value: `${stats?.longest_streak || 0}` },
          { label: 'Total Picks', value: stats?.total_picks?.toString() || '0' },
          { label: 'Correct Picks', value: stats?.correct_picks?.toString() || '0' },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-white text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Points breakdown */}
      {stats && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Points Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: 'Accuracy Points', value: stats.accuracy_points, color: 'bg-sky-500' },
              { label: 'Boldness Bonus', value: stats.boldness_points, color: 'bg-amber-500' },
              { label: 'Streak Bonus', value: stats.streak_bonus_points, color: 'bg-green-500' },
            ].map((item) => {
              const pct = stats.total_points > 0 ? (item.value / stats.total_points) * 100 : 0
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/60">{item.label}</span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full">
                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
