'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PRO_FEATURES } from '@/lib/stripe-client'
import { createClient } from '@/lib/supabase/client'

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/signup')
      return
    }

    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const { url, error } = await res.json()

    if (error || !url) {
      console.error(error)
      setLoading(false)
      return
    }

    window.location.href = url
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
        <Link href="/" className="text-lg font-bold tracking-tight">Playcall</Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">Log in</Link>
          <Link href="/signup" className="px-4 py-2 text-sm bg-white text-black rounded-lg font-semibold hover:bg-white/90 transition-colors">Sign up free</Link>
        </div>
      </nav>

      <section className="px-8 pt-20 pb-10 max-w-3xl mx-auto text-center">
        <p className="text-xs text-white/25 uppercase tracking-widest font-semibold mb-4">Pricing</p>
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">
          Simple pricing.
          <br />
          <span className="text-sky-400">One tier worth paying for.</span>
        </h1>
        <p className="text-white/40 text-base max-w-md mx-auto">
          Start free. Upgrade when you want the edge.
        </p>
      </section>

      {/* Plans */}
      <section className="px-8 pb-24 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Free */}
          <div className="p-7 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <div className="mb-6">
              <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-2">Free</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-extrabold">$0</span>
                <span className="text-white/30 text-sm mb-1">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Daily game picks',
                'Accuracy + boldness + streak scoring',
                'Global leaderboard',
                'Friend leaderboards',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/60">
                  <span className="text-white/20 mt-0.5">+</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center py-2.5 rounded-lg border border-white/10 text-white/50 text-sm font-semibold hover:bg-white/5 transition-colors"
            >
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="relative p-7 rounded-2xl bg-sky-500/[0.06] border border-sky-500/30">
            <div className="absolute top-4 right-4 px-2 py-0.5 rounded-md bg-sky-500 text-white text-xs font-bold uppercase tracking-wide">
              Pro
            </div>
            <div className="mb-6">
              <p className="text-xs text-sky-400/60 uppercase tracking-widest font-semibold mb-2">Playcall Pro</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-extrabold">$4</span>
                <span className="text-white/30 text-sm mb-1">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {['Everything in Free', ...PRO_FEATURES].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                  <span className="text-sky-400 mt-0.5">+</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {loading ? 'Redirecting...' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
