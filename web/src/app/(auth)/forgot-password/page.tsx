'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <Link href="/" className="block text-2xl font-bold text-white mb-8">Playcall</Link>
          <div className="w-14 h-14 rounded-full bg-sky-500/20 flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl">📬</span>
          </div>
          <h1 className="text-xl font-semibold text-white mb-3">Check your email</h1>
          <p className="text-white/40 text-sm mb-6">
            We sent a password reset link to <span className="text-white/70">{email}</span>.
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
        <h1 className="text-xl font-semibold text-white mb-2">Reset your password</h1>
        <p className="text-white/40 text-sm mb-6">Enter your email and we will send you a reset link.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-sky-500 transition"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl font-semibold transition"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <p className="text-center text-white/40 text-sm mt-6">
          <Link href="/login" className="text-sky-400 hover:text-sky-300">Back to log in</Link>
        </p>
      </div>
    </div>
  )
}
