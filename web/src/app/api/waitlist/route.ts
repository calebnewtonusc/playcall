import { NextRequest, NextResponse } from 'next/server'
import { sendToClayWebhook, CLAY_PLAYCALL_WEBHOOK_URL } from '@/lib/clay'

// Simple in-memory rate limiter — not production-grade, fine for low-volume waitlist
// Resets on server restart. Limit: 3 submissions per IP per 10 minutes.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true
  }

  entry.count += 1
  return false
}

interface WaitlistBody {
  email: string
  name?: string
  source?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit by IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  let body: WaitlistBody
  try {
    body = (await request.json()) as WaitlistBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  const payload = {
    email: body.email.trim().toLowerCase(),
    name: body.name?.trim() ?? null,
    source: body.source?.trim() ?? 'playcall-website',
    created_at: new Date().toISOString(),
  }

  // Send to Clay (fire-and-forget on failure — don't block the response)
  sendToClayWebhook(CLAY_PLAYCALL_WEBHOOK_URL, payload).catch((err) => {
    console.error('[waitlist] Clay webhook error (non-fatal):', err)
  })

  // Attempt to save to Supabase if configured — graceful fail if table doesn't exist
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.warn('[waitlist] Supabase insert failed (non-fatal):', res.status, text)
      }
    } catch (err) {
      console.warn('[waitlist] Supabase insert threw (non-fatal):', err)
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
