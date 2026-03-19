import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Playcall',
    template: '%s | Playcall',
  },
  description: 'Skill-based sports predictions. No money, all thrill.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://playcall.app'),
  openGraph: {
    siteName: 'Playcall',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
