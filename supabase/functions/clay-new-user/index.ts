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

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RETRY_DELAYS_MS = [1000, 2000, 4000]

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
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        console.log(`[Clay] Delivered (attempt ${attempt + 1})`)
        return
      }

      const body = await res.text().catch(() => '')
      lastError = new Error(`HTTP ${res.status}: ${body}`)
      console.warn(`[Clay] Attempt ${attempt + 1} failed: ${res.status}`)
    } catch (err) {
      lastError = err
      console.warn(`[Clay] Attempt ${attempt + 1} threw:`, err)
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }

  console.error('[Clay] All attempts failed. Last error:', lastError)
}

serve(async (req) => {
  // Validate shared secret
  const functionSecret = Deno.env.get('FUNCTION_SECRET')
  if (functionSecret) {
    const auth = req.headers.get('Authorization')
    if (auth !== `Bearer ${functionSecret}`) {
      return new Response('Unauthorized', { status: 401 })
    }
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

  // Supabase database webhooks send { type, table, record, old_record, schema }
  const record = (body.record ?? body) as Record<string, unknown>

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
