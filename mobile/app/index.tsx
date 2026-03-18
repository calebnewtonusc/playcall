import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { createClient } from './lib/supabase'

export default function Index() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/(tabs)/picks')
      } else {
        router.replace('/(auth)/login')
      }
    }
    checkAuth()
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' }}>
      <ActivityIndicator color="#0ea5e9" size="large" />
    </View>
  )
}
