import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native'
import { createClient } from '../lib/supabase'
import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'

const PRO_FEATURES = [
  'Pro badge on leaderboard',
  'Advanced stats breakdown by sport',
  'Full pick history, all time',
  'Boldness analytics and trends',
  'Early access to new features',
]

interface Profile { username: string; is_pro: boolean }

export default function BillingScreen() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      async function fetchProfile() {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        const { data } = await supabase
          .from('profiles')
          .select('username, is_pro')
          .eq('id', user.id)
          .single()
        setProfile(data)
        setLoading(false)
      }
      fetchProfile()
    }, [])
  )

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#0ea5e9" size="large" /></View>
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Billing</Text>
      <Text style={styles.subheading}>Manage your subscription</Text>

      <View style={styles.card}>
        <View style={styles.planRow}>
          <View>
            <Text style={styles.planLabel}>Current Plan</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.planName}>{profile?.is_pro ? 'Playcall Pro' : 'Free'}</Text>
              {profile?.is_pro && (
                <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
              )}
            </View>
          </View>
          <Text style={styles.price}>{profile?.is_pro ? '$4' : '$0'}<Text style={styles.pricePer}>/mo</Text></Text>
        </View>

        {profile?.is_pro ? (
          <View style={{ gap: 8, marginBottom: 16 }}>
            {['Everything in Free', ...PRO_FEATURES].map((f) => (
              <View key={f} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ color: '#38bdf8' }}>+</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{f}</Text>
              </View>
            ))}
          </View>
        ) : (
          <>
            <Text style={styles.upgradeText}>
              Upgrade for advanced analytics, your full pick history, and a Pro badge.
            </Text>
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => Linking.openURL('https://playcall.app/pricing')}
            >
              <Text style={styles.upgradeBtnText}>Upgrade to Pro — $4/mo</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' },
  heading: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subheading: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 20 },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  planLabel: { fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  planName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  proBadge: { backgroundColor: '#0ea5e9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  proBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  price: { fontSize: 28, fontWeight: '800', color: '#fff' },
  pricePer: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.3)' },
  upgradeText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  upgradeBtn: { backgroundColor: '#0ea5e9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
