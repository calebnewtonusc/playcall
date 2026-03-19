/**
 * Clay webhook utility for Playcall.
 *
 * Usage:
 *   import { sendToClayWebhook, CLAY_PLAYCALL_WEBHOOK_URL } from '@/lib/clay'
 *
 *   await sendToClayWebhook(CLAY_PLAYCALL_WEBHOOK_URL, { email, name, ... })
 *
 * Set the env var CLAY_PLAYCALL_WEBHOOK_URL to the full webhook URL from Clay
 * (e.g. https://api.clay.com/v3/sources/webhook/YOUR_UNIQUE_TOKEN).
 * The URL itself is the secret — no Authorization header is needed.
 */

export const CLAY_PLAYCALL_WEBHOOK_URL: string | undefined =
  process.env.CLAY_PLAYCALL_WEBHOOK_URL

const RETRY_DELAYS_MS = [1000, 2000, 4000]

/**
 * POST JSON data to a Clay webhook URL with up to 3 retries (exponential backoff).
 * Automatically injects idempotencyKey and sentAt into every payload.
 *
 * @param webhookUrl - The full Clay webhook URL (URL is the secret, no auth header needed)
 * @param data       - Arbitrary key/value payload to send
 */
export async function sendToClayWebhook(
  webhookUrl: string | undefined,
  data: Record<string, unknown>
): Promise<void> {
  if (!webhookUrl) {
    console.warn('[Clay] webhookUrl is undefined — skipping')
    return
  }

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
        console.log(`[Clay] Webhook delivered (attempt ${attempt + 1})`)
        return
      }

      const body = await res.text().catch(() => '')
      lastError = new Error(`HTTP ${res.status}: ${body}`)
      console.warn(`[Clay] Webhook attempt ${attempt + 1} failed: ${res.status} ${res.statusText}`)
    } catch (err) {
      lastError = err
      console.warn(`[Clay] Webhook attempt ${attempt + 1} threw:`, err)
    }

    // Don't sleep after the last attempt
    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }

  console.error('[Clay] All webhook attempts failed. Last error:', lastError)
}
