import { NextRequest, NextResponse } from 'next/server'
import { getStripeServer, getProPriceId } from '@/lib/stripe'
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
    .select('stripe_customer_id, username')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    let customer
    try {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id, username: profile?.username ?? '' },
      })
    } catch (err) {
      console.error('[checkout] Stripe customer creation failed:', err)
      return NextResponse.json({ error: 'Failed to create billing account' }, { status: 500 })
    }
    customerId = customer.id

    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // Always use the configured site URL — never trust client Origin header for redirect URLs
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  let session
  try {
    session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: getProPriceId(), quantity: 1 }],
      success_url: `${origin}/billing?success=true`,
      cancel_url: `${origin}/pricing`,
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
    })
  } catch (err) {
    console.error('[checkout] Stripe session creation failed:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
