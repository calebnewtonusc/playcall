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
const FETCH_TIMEOUT_MS = 8000

function isValidClayUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('clay.com')
  } catch {
    return false
  }
}

/**
 * POST JSON data to a Clay webhook URL with up to 3 retries (exponential backoff).
 * Automatically injects idempotencyKey and sentAt into every payload.
 * The idempotencyKey is stable across retries so Clay deduplicates correctly.
 *
 * @param webhookUrl - The full Clay webhook URL (URL is the secret, no auth header needed)
 * @param data       - Arbitrary key/value payload to send
 * @throws if all retry attempts fail
 */
export async function sendToClayWebhook(
  webhookUrl: string | undefined,
  data: Record<string, unknown>
): Promise<void> {
  if (!webhookUrl) {
    console.warn('[Clay] webhookUrl is undefined — skipping')
    return
  }

  if (!isValidClayUrl(webhookUrl)) {
    console.error('[Clay] Invalid webhook URL — must be https://*.clay.com/...')
    return
  }

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
        console.log(`[Clay] Webhook delivered (attempt ${attempt + 1})`)
        return
      }

      const body = await res.text().catch(() => '')
      lastError = new Error(`HTTP ${res.status}: ${body}`)
      console.warn(`[Clay] Webhook attempt ${attempt + 1} failed: ${res.status} ${res.statusText}`)

      // Don't retry client errors — 4xx (except 429) will never succeed on retry
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        break
      }
    } catch (err) {
      clearTimeout(timeout)
      lastError = err
      const label = (err instanceof Error && err.name === 'AbortError') ? 'timed out' : 'threw'
      console.warn(`[Clay] Webhook attempt ${attempt + 1} ${label}:`, err)
    }

    // Don't sleep after the last attempt
    if (attempt < RETRY_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }

  console.error('[Clay] All webhook attempts failed. Last error:', lastError)
  throw lastError
}
