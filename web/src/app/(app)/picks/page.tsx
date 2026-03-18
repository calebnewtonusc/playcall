'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import GameCard from '@/components/GameCard'
import { Game, Pick, Winner } from '@/lib/types'

export default function PicksPage() {
  const [games, setGames] = useState<Game[]>([])
  const [picks, setPicks] = useState<Record<string, Pick>>({})
  const [loading, setLoading] = useState(true)
  const [pickLoading, setPickLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: gamesData }, { data: picksData }] = await Promise.all([
      supabase.from('games').select('*').order('start_time', { ascending: true }),
      supabase.from('picks').select('*').eq('user_id', user.id),
    ])

    setGames(gamesData || [])
    const picksMap: Record<string, Pick> = {}
    picksData?.forEach((p) => { picksMap[p.game_id] = p })
    setPicks(picksMap)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handlePick(gameId: string, winner: Winner) {
    setPickLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('picks')
      .upsert({ user_id: user.id, game_id: gameId, predicted_winner: winner }, { onConflict: 'user_id,game_id' })
      .select()
      .single()

    if (data) {
      setPicks((prev) => ({ ...prev, [gameId]: data }))
    }
    setPickLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const upcoming = games.filter((g) => g.status === 'upcoming')
  const finished = games.filter((g) => g.status === 'finished')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Today's Games</h1>
        <p className="text-white/40 text-sm">Make your picks before games start</p>
      </div>

      {upcoming.length === 0 && (
        <div className="text-center py-16 text-white/30">No upcoming games right now</div>
      )}

      <div className="space-y-4">
        {upcoming.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            existingPick={picks[game.id]}
            onPick={handlePick}
            loading={pickLoading}
          />
        ))}
      </div>

      {finished.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white/60 mb-4">Recent Results</h2>
          <div className="space-y-4">
            {finished.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                existingPick={picks[game.id]}
                onPick={handlePick}
                loading={pickLoading}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
