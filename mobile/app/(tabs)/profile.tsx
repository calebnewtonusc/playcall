import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { createClient } from '../lib/supabase'

interface Profile { id: string; username: string; display_name: string | null }
interface Stats {
  total_picks: number; correct_picks: number; current_streak: number; longest_streak: number
  total_points: number; accuracy_points: number; boldness_points: number; streak_bonus_points: number
}

export default function ProfileScreen() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/(auth)/login')
          return
        }
        const [{ data: p, error: profileErr }, { data: s, error: statsErr }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
        ])
        if (profileErr) throw profileErr
        if (statsErr && statsErr.code !== 'PGRST116') throw statsErr
        setProfile(p)
        setStats(s)
      } catch {
        setError('Failed to load profile. Pull to refresh.')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [router])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/(auth)/login')
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#0ea5e9" /></View>

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#f87171', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 }}>{error}</Text>
      </View>
    )
  }

  const accuracy = stats && stats.total_picks > 0
    ? Math.round((stats.correct_picks / stats.total_picks) * 100)
    : 0

  const statItems = [
    { label: 'Total Points', value: stats?.total_points?.toLocaleString() || '0' },
    { label: 'Accuracy', value: `${accuracy}%` },
    { label: 'Current Streak', value: `${stats?.current_streak || 0} 🔥` },
    { label: 'Best Streak', value: `${stats?.longest_streak || 0}` },
    { label: 'Total Picks', value: stats?.total_picks?.toString() || '0' },
    { label: 'Correct', value: stats?.correct_picks?.toString() || '0' },
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.username?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.displayName}>{profile?.display_name || profile?.username}</Text>
        <Text style={styles.username}>@{profile?.username}</Text>
      </View>

      {/* Stats grid */}
      <View style={styles.grid}>
        {statItems.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Points breakdown */}
      {stats && (
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>Points Breakdown</Text>
          {[
            { label: 'Accuracy', value: stats.accuracy_points, color: '#0ea5e9' },
            { label: 'Boldness', value: stats.boldness_points, color: '#f59e0b' },
            { label: 'Streaks', value: stats.streak_bonus_points, color: '#22c55e' },
          ].map((item) => {
            const pct = stats.total_points > 0 ? (item.value / stats.total_points) * 100 : 0
            return (
              <View key={item.label} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{item.label}</Text>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{item.value}</Text>
                </View>
                <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <View style={{ height: 4, backgroundColor: item.color, borderRadius: 2, width: `${pct}%` }} />
                </View>
              </View>
            )
          })}
        </View>
      )}

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(14,165,233,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#38bdf8' },
  displayName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  username: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 16,
  },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  breakdown: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 16, marginBottom: 16,
  },
  breakdownTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 14 },
  signOutBtn: {
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center',
  },
  signOutText: { color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: 15 },
})
