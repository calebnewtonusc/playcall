'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PRO_FEATURES } from '@/lib/stripe-client'

interface Profile {
  username: string
  is_pro: boolean
  stripe_customer_id: string | null
}

function BillingContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('username, is_pro, stripe_customer_id')
        .eq('id', user.id)
        .single()
      setProfile(data)
      setLoading(false)
    }
    fetchProfile()
  }, [])

  async function handlePortal() {
    setPortalLoading(true)
    setPortalError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (url) {
        window.location.href = url
      } else {
        setPortalError(error || 'Could not open billing portal. Please try again.')
        setPortalLoading(false)
      }
    } catch {
      setPortalError('Something went wrong. Please try again.')
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Billing</h1>
        <p className="text-white/40 text-sm">Manage your subscription</p>
      </div>

      {/* Success banner */}
      {success && (
        <div className="px-5 py-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium">
          You are now a Playcall Pro member. Welcome.
        </div>
      )}

      {/* Current plan */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-1">Current Plan</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">
                {profile?.is_pro ? 'Playcall Pro' : 'Free'}
              </span>
              {profile?.is_pro && (
                <span className="px-2 py-0.5 rounded-md bg-sky-500 text-white text-xs font-bold uppercase">Pro</span>
              )}
            </div>
          </div>
          {profile?.is_pro ? (
            <span className="text-2xl font-extrabold text-white">$4<span className="text-sm text-white/30 font-normal">/mo</span></span>
          ) : (
            <span className="text-2xl font-extrabold text-white">$0<span className="text-sm text-white/30 font-normal">/mo</span></span>
          )}
        </div>

        {profile?.is_pro ? (
          <div className="space-y-2 mb-5">
            {['Everything in Free', ...PRO_FEATURES].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-white/60">
                <span className="text-sky-400">+</span> {f}
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-5">
            <p className="text-white/40 text-sm mb-4">
              Upgrade to Pro for advanced analytics, your full pick history, and a Pro badge on the leaderboard.
            </p>
            <Link
              href="/pricing"
              className="inline-flex px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Upgrade to Pro
            </Link>
          </div>
        )}

        {profile?.is_pro && profile.stripe_customer_id && (
          <div>
            {portalError && <p className="text-red-400 text-xs mb-2">{portalError}</p>}
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="text-sm text-white/40 hover:text-white disabled:opacity-50 transition-colors underline underline-offset-2"
            >
              {portalLoading ? 'Opening portal...' : 'Manage subscription'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <BillingContent />
    </Suspense>
  )
}
