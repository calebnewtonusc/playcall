/**
 * Supabase Edge Function: clay-new-user
 *
 * Fires when a new user signs up for Playcall. Sends the user's data
 * to the Clay "Playcall Beta Users" table via webhook.
 *
 * Deploy:
 *   supabase functions deploy clay-new-user
 *
 * Set secrets:
 *   supabase secrets set CLAY_PLAYCALL_WEBHOOK_URL=https://api.clay.com/v3/sources/webhook/YOUR_TOKEN
 *   supabase secrets set FUNCTION_SECRET=YOUR_SHARED_SECRET
 *
 * In Supabase Dashboard > Database > Webhooks, create a webhook on auth.users INSERT
 * pointing to: https://<project>.supabase.co/functions/v1/clay-new-user
 * with header Authorization: Bearer YOUR_SHARED_SECRET
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const RETRY_DELAYS_MS = [1000, 2000, 4000]
const FETCH_TIMEOUT_MS = 8000

async function sendToClayWebhook(
  webhookUrl: string,
  data: Record<string, unknown>
): Promise<void> {
  const payload = {
    ...data,
    idempotencyKey: crypto.randomUUID(),
    sentAt: new Date().toISOString(),
  }

  let lastError: unknown

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (res.ok) {
        console.log(`[Clay] Delivered (attempt ${attempt + 1})`)
        return
      }

      const body = await res.text().catch(() => '')
      lastError = new Error(`HTTP ${res.status}: ${body}`)
      console.warn(`[Clay] Attempt ${attempt + 1} failed: ${res.status}`)

      // Don't retry client errors — 4xx (except 429) will never succeed on retry
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        break
      }
    } catch (err) {
      clearTimeout(timeout)
      lastError = err
      const label = (err instanceof Error && err.name === 'AbortError') ? 'timed out' : 'threw'
      console.warn(`[Clay] Attempt ${attempt + 1} ${label}:`, err)
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }

  console.error('[Clay] All attempts failed. Last error:', lastError)
}

serve(async (req) => {
  // Validate shared secret — FUNCTION_SECRET must be set; reject if missing
  const functionSecret = Deno.env.get('FUNCTION_SECRET')
  if (!functionSecret) {
    console.error('[clay-new-user] FUNCTION_SECRET is not configured')
    return new Response('Internal Server Error: missing secret', { status: 500 })
  }
  const auth = req.headers.get('Authorization') ?? ''
  const expected = `Bearer ${functionSecret}`
  // Timing-safe comparison prevents secret enumeration via timing attacks
  const authBytes = new TextEncoder().encode(auth.padEnd(expected.length))
  const expectedBytes = new TextEncoder().encode(expected.padEnd(auth.length))
  const isValid =
    auth.length === expected.length &&
    crypto.subtle.timingSafeEqual(authBytes, expectedBytes)
  if (!isValid) {
    return new Response('Unauthorized', { status: 401 })
  }

  const webhookUrl = Deno.env.get('CLAY_PLAYCALL_WEBHOOK_URL')
  if (!webhookUrl) {
    console.warn('[Clay] CLAY_PLAYCALL_WEBHOOK_URL not set — skipping')
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // Supabase database webhooks must include a `record` field
  if (!body.record || typeof body.record !== 'object') {
    return new Response('Invalid payload: missing record', { status: 400 })
  }
  const record = body.record as Record<string, unknown>

  await sendToClayWebhook(webhookUrl, {
    event: 'new_signup',
    source: 'playcall',
    user_id: record.id,
    email: record.email,
    name: (record.raw_user_meta_data as Record<string, unknown>)?.full_name,
    avatar_url: (record.raw_user_meta_data as Record<string, unknown>)?.avatar_url,
    provider: (record.raw_app_meta_data as Record<string, unknown>)?.provider,
    created_at: record.created_at,
  })

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
