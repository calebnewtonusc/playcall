'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: username } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.session) {
      // Email confirmation disabled — session returned immediately
      router.push('/picks')
    } else {
      // Email confirmation required
      setConfirmed(true)
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <Link href="/" className="block text-2xl font-bold text-white mb-8">Playcall</Link>
          <div className="w-14 h-14 rounded-full bg-sky-500/20 flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl">📬</span>
          </div>
          <h1 className="text-xl font-semibold text-white mb-3">Check your email</h1>
          <p className="text-white/40 text-sm mb-6">
            We sent a confirmation link to <span className="text-white/70">{email}</span>. Click it to activate your account.
          </p>
          <Link href="/login" className="text-sky-400 text-sm hover:text-sky-300 transition">Back to log in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-2xl font-bold text-white mb-8">Playcall</Link>
        <h1 className="text-xl font-semibold text-white mb-6">Create your account</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-sky-500 transition"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-sky-500 transition"
          />
          <input
            type="password"
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-sky-500 transition"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl font-semibold transition"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-white/40 text-sm mt-6">
          Have an account?{' '}
          <Link href="/login" className="text-sky-400 hover:text-sky-300">Log in</Link>
        </p>
      </div>
    </div>
  )
}
