import { NextRequest, NextResponse } from 'next/server'
import { getStripeServer } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const stripe = getStripeServer()
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
  }

  // Always use the configured site URL — never trust client Origin header for redirect URLs
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  let session
  try {
    session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/billing`,
    })
  } catch (err) {
    console.error('[portal] Stripe portal session creation failed:', err)
    return NextResponse.json({ error: 'Failed to open billing portal' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
