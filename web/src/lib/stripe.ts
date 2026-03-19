import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

let _stripe: Stripe | null = null
export function getStripeServer(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
    })
  }
  return _stripe
}

// Alias for convenience in API routes
export { getStripeServer as stripe }

let stripePromise: ReturnType<typeof loadStripe>
export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!

export const PRO_FEATURES = [
  'Pro badge on leaderboard',
  'Advanced stats breakdown by sport',
  'Full pick history, all time',
  'Boldness analytics and trends',
  'Early access to new features',
]
