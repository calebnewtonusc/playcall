import Stripe from 'stripe'

let _stripe: Stripe | null = null
export function getStripeServer(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('[stripe] STRIPE_SECRET_KEY is not configured')
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-02-25.clover',
    })
  }
  return _stripe
}

export { getStripeServer as stripe }

export function getProPriceId(): string {
  const id = process.env.STRIPE_PRO_PRICE_ID
  if (!id) throw new Error('[stripe] STRIPE_PRO_PRICE_ID is not configured')
  return id
}
