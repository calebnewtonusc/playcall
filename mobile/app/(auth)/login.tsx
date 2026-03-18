import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, Link } from 'expo-router'
import { createClient } from '../lib/supabase'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      Alert.alert('Error', error.message)
      setLoading(false)
    } else {
      router.replace('/(tabs)/picks')
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.logo}>Playcall</Text>
        <Text style={styles.title}>Welcome back</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log in'}</Text>
        </TouchableOpacity>
        <Link href="/(auth)/signup" style={styles.link}>
          No account? Sign up
        </Link>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 32 },
  title: { fontSize: 22, fontWeight: '600', color: '#fff', marginBottom: 24 },
  input: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, color: '#fff', backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12, fontSize: 16,
  },
  button: { backgroundColor: '#0ea5e9', paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16, textAlign: 'center' },
  link: { color: '#38bdf8', textAlign: 'center', marginTop: 16, fontSize: 14 },
})
