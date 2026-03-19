'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import clsx from 'clsx'

const links = [
  { href: '/picks', label: 'Picks' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/profile', label: 'Profile' },
  { href: '/billing', label: 'Billing' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/10">
      <Link href="/picks" className="text-xl font-bold text-white tracking-tight">
        Playcall
      </Link>
      <div className="flex items-center gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition',
              pathname === l.href
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            )}
          >
            {l.label}
          </Link>
        ))}
        <button
          onClick={handleSignOut}
          className="ml-2 px-4 py-2 text-sm text-white/40 hover:text-white transition"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
