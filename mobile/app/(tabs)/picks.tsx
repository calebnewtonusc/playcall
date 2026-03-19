import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert } from 'react-native'
import { createClient } from '../lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { useFocusEffect } from 'expo-router'

interface Game {
  id: string; sport: string; home_team: string; away_team: string
  start_time: string; status: string; winner: string | null
  home_win_probability: number | null; away_win_probability: number | null
}
interface Pick {
  id: string; game_id: string; predicted_winner: string
  is_correct: boolean | null; total_points: number
}

const SPORT_EMOJI: Record<string, string> = { NFL: '🏈', NBA: '🏀', Soccer: '⚽' }

function getTimeLabel(game: Game): string {
  if (game.status === 'finished') return 'Final'
  if (game.status === 'live') return 'Live'
  const start = new Date(game.start_time)
  if (start < new Date()) return 'In progress'
  return formatDistanceToNow(start, { addSuffix: true })
}

export default function PicksScreen() {
  const [games, setGames] = useState<Game[]>([])
  const [picks, setPicks] = useState<Record<string, Pick>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pickLoading, setPickLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: gamesData, error: gamesError }, { data: picksData, error: picksError }] = await Promise.all([
      supabase.from('games').select('*').order('start_time', { ascending: true }),
      supabase.from('picks').select('*').eq('user_id', user.id),
    ])

    if (gamesError || picksError) {
      setError('Failed to load games. Pull down to retry.')
    } else {
      setGames(gamesData || [])
      const map: Record<string, Pick> = {}
      picksData?.forEach((p) => { map[p.game_id] = p })
      setPicks(map)
      setError(null)
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useFocusEffect(useCallback(() => {
    setLoading(true)
    fetchData()
  }, [fetchData]))

  async function handlePick(gameId: string, winner: string) {
    setPickLoading((prev) => ({ ...prev, [gameId]: true }))
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setPickLoading((prev) => ({ ...prev, [gameId]: false })); return }
    const { data, error: pickError } = await supabase
      .from('picks')
      .upsert({ user_id: user.id, game_id: gameId, predicted_winner: winner }, { onConflict: 'user_id,game_id' })
      .select().single()
    if (pickError) {
      Alert.alert('Error', 'Failed to save pick. Please try again.')
    } else if (data) {
      setPicks((prev) => ({ ...prev, [gameId]: data }))
    }
    setPickLoading((prev) => ({ ...prev, [gameId]: false }))
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#0ea5e9" size="large" /></View>
  }

  const upcoming = games.filter((g) => g.status === 'upcoming')
  const finished = games.filter((g) => g.status === 'finished')

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData() }} tintColor="#0ea5e9" />}
    >
      <Text style={styles.heading}>Today's Games</Text>
      <Text style={styles.subheading}>Make your picks before games start</Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {upcoming.length === 0 && !error && (
        <Text style={styles.empty}>No upcoming games right now</Text>
      )}

      {upcoming.map((game) => {
        const pick = picks[game.id]
        const isPast = new Date(game.start_time) < new Date()
        const canPick = !isPast && !pick
        return (
          <View key={game.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sport}>{SPORT_EMOJI[game.sport]} {game.sport}</Text>
              <Text style={styles.time}>{getTimeLabel(game)}</Text>
            </View>
            <View style={styles.teams}>
              <View style={styles.team}>
                <Text style={styles.teamName}>{game.home_team}</Text>
                {game.home_win_probability != null && (
                  <Text style={styles.prob}>{Math.round(game.home_win_probability * 100)}%</Text>
                )}
              </View>
              <Text style={styles.vs}>VS</Text>
              <View style={[styles.team, { alignItems: 'flex-end' }]}>
                <Text style={[styles.teamName, { textAlign: 'right' }]}>{game.away_team}</Text>
                {game.away_win_probability != null && (
                  <Text style={styles.prob}>{Math.round(game.away_win_probability * 100)}%</Text>
                )}
              </View>
            </View>
            {canPick && (
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.pickBtn, pickLoading[game.id] && styles.pickBtnDisabled]}
                  onPress={() => handlePick(game.id, 'home')}
                  disabled={pickLoading[game.id] ?? false}
                >
                  <Text style={styles.pickBtnText}>{game.home_team}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pickBtn, pickLoading[game.id] && styles.pickBtnDisabled]}
                  onPress={() => handlePick(game.id, 'away')}
                  disabled={pickLoading[game.id] ?? false}
                >
                  <Text style={styles.pickBtnText}>{game.away_team}</Text>
                </TouchableOpacity>
              </View>
            )}
            {pick && (
              <View style={[
                styles.pickResult,
                pick.is_correct === true && { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.3)' },
                pick.is_correct === false && { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' },
              ]}>
                <Text style={{ color: pick.is_correct === true ? '#4ade80' : pick.is_correct === false ? '#f87171' : 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' }}>
                  {pick.is_correct === true ? `Correct! +${pick.total_points} pts` :
                   pick.is_correct === false ? 'Wrong pick' :
                   `Picked: ${pick.predicted_winner === 'home' ? game.home_team : game.away_team}`}
                </Text>
              </View>
            )}
          </View>
        )
      })}

      {finished.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Recent Results</Text>
          {finished.map((game) => {
            const pick = picks[game.id]
            return (
              <View key={game.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.sport}>{SPORT_EMOJI[game.sport]} {game.sport}</Text>
                  <Text style={styles.time}>Final</Text>
                </View>
                <View style={styles.teams}>
                  <View style={styles.team}>
                    <Text style={[styles.teamName, game.winner === 'home' && { color: '#4ade80' }]}>{game.home_team}</Text>
                  </View>
                  <Text style={styles.vs}>VS</Text>
                  <View style={[styles.team, { alignItems: 'flex-end' }]}>
                    <Text style={[styles.teamName, { textAlign: 'right' }, game.winner === 'away' && { color: '#4ade80' }]}>{game.away_team}</Text>
                  </View>
                </View>
                {pick ? (
                  <View style={[
                    styles.pickResult,
                    pick.is_correct === true && { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.3)' },
                    pick.is_correct === false && { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' },
                  ]}>
                    <Text style={{ color: pick.is_correct === true ? '#4ade80' : '#f87171', fontSize: 13, textAlign: 'center' }}>
                      {pick.is_correct === true ? `Correct! +${pick.total_points} pts` : 'Wrong pick'}
                    </Text>
                  </View>
                ) : game.winner ? (
                  <Text style={styles.winnerLabel}>Winner: {game.winner === 'home' ? game.home_team : game.away_team}</Text>
                ) : null}
              </View>
            )
          })}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' },
  heading: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subheading: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24 },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginTop: 8, marginBottom: 12 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 16, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sport: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  time: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  teams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  team: { flex: 1 },
  teamName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  prob: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  vs: { fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: '700', marginHorizontal: 8 },
  buttons: { flexDirection: 'column', gap: 8, marginTop: 12 },
  pickBtn: {
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: 'rgba(14,165,233,0.15)', borderWidth: 1, borderColor: 'rgba(14,165,233,0.3)',
  },
  pickBtnDisabled: { opacity: 0.5 },
  pickBtnText: { color: '#38bdf8', fontWeight: '600', fontSize: 13, textAlign: 'center' },
  pickResult: {
    marginTop: 10, padding: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  winnerLabel: { marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: '#f87171', fontSize: 13, textAlign: 'center' },
  empty: { color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 40 },
})
