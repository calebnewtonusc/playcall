import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { createClient } from '../lib/supabase'

interface Entry {
  user_id: string; username: string; display_name: string | null
  total_points: number; correct_picks: number; total_picks: number; current_streak: number; rank: number
}

type Tab = 'total' | 'accuracy' | 'streak'

export default function LeaderboardScreen() {
  const [allData, setAllData] = useState<Omit<Entry, 'rank'>[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('total')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      const { data } = await supabase
        .from('user_stats')
        .select('*, profiles!inner(username, display_name)')
        .order('total_points', { ascending: false })
        .limit(100)

      const mapped: Omit<Entry, 'rank'>[] = (data || []).map((row: {
        user_id: string; total_points: number; correct_picks: number
        total_picks: number; current_streak: number
        profiles: { username: string; display_name: string | null }
      }) => ({
        user_id: row.user_id,
        username: row.profiles.username,
        display_name: row.profiles.display_name,
        total_points: row.total_points,
        correct_picks: row.correct_picks,
        total_picks: row.total_picks,
        current_streak: row.current_streak,
      }))

      setAllData(mapped)
      setLoading(false)
    }
    fetchLeaderboard()
  }, [])

  // Re-sort client-side when tab changes
  useEffect(() => {
    const sorted =
      tab === 'accuracy'
        ? [...allData].sort((a, b) => {
            const ra = a.total_picks > 0 ? a.correct_picks / a.total_picks : 0
            const rb = b.total_picks > 0 ? b.correct_picks / b.total_picks : 0
            return rb - ra
          })
        : tab === 'streak'
        ? [...allData].sort((a, b) => b.current_streak - a.current_streak)
        : allData

    setEntries(sorted.slice(0, 50).map((e, i) => ({ ...e, rank: i + 1 })))
  }, [tab, allData])

  const RANK_COLORS: Record<number, string> = { 1: '#facc15', 2: '#cbd5e1', 3: '#b45309' }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'total', label: 'Points' },
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'streak', label: 'Streaks' },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Leaderboard</Text>
        <Text style={styles.subheading}>Top pickers this season</Text>
      </View>

      <View style={styles.tabs}>
        {tabs.map((t) => (
          <TouchableOpacity key={t.key} style={[styles.tab, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#0ea5e9" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {entries.length === 0 && (
            <Text style={styles.empty}>No entries yet. Be the first!</Text>
          )}
          {entries.map((entry) => {
            const accuracy = entry.total_picks > 0 ? Math.round((entry.correct_picks / entry.total_picks) * 100) : 0
            const isMe = entry.user_id === currentUserId
            return (
              <View key={entry.user_id} style={[styles.row, isMe && styles.rowMe]}>
                <Text style={[styles.rank, { color: RANK_COLORS[entry.rank] || 'rgba(255,255,255,0.3)' }]}>
                  {entry.rank}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, isMe && { color: '#38bdf8' }]}>
                    {entry.display_name || entry.username}{isMe ? ' (you)' : ''}
                  </Text>
                  <Text style={styles.username}>@{entry.username}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.points}>{entry.total_points.toLocaleString()} pts</Text>
                  <Text style={styles.accuracy}>{accuracy}% accuracy</Text>
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  heading: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subheading: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#0ea5e9' },
  tabText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  tabTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 8,
  },
  rowMe: { backgroundColor: 'rgba(14,165,233,0.1)', borderColor: 'rgba(14,165,233,0.3)' },
  rank: { width: 24, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  name: { fontSize: 14, fontWeight: '600', color: '#fff' },
  username: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 },
  points: { fontSize: 14, fontWeight: '700', color: '#fff' },
  accuracy: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 },
})
