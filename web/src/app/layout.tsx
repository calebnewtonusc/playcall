import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Playcall — Pick Games, Not Losses',
  description: 'Skill-based sports predictions. No money, all thrill.',
  openGraph: {
    title: 'Playcall',
    description: 'Skill-based sports predictions. No money, all thrill.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
