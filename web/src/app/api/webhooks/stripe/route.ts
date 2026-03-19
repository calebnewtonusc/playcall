import { NextRequest, NextResponse } from 'next/server'
import { getStripeServer } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function setProStatus(userId: string, isPro: boolean) {
  await getSupabaseAdmin()
    .from('profiles')
    .update({ is_pro: isPro })
    .eq('id', userId)
}

export async function POST(req: NextRequest) {
  const stripe = getStripeServer()
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const getUserId = (obj: { metadata?: Record<string, string> }) =>
    obj.metadata?.supabase_user_id

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        const userId = getUserId(sub)
        if (userId && sub.status === 'active') {
          await setProStatus(userId, true)
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = getUserId(sub)
      if (userId) {
        const isPro = sub.status === 'active' || sub.status === 'trialing'
        await setProStatus(userId, isPro)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = getUserId(sub)
      if (userId) {
        await setProStatus(userId, false)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null }
      if (invoice.subscription) {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription)
        const userId = getUserId(sub)
        if (userId) {
          await setProStatus(userId, false)
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
