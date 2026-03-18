import Link from 'next/link'

const FEATURES = [
  {
    label: 'Accuracy',
    icon: '🎯',
    points: '+10 pts',
    desc: 'Every correct pick earns 10 points. Simple.',
  },
  {
    label: 'Boldness',
    icon: '⚡',
    points: 'up to 3x',
    desc: 'Pick underdogs. Multiply your score. Take the risk.',
  },
  {
    label: 'Streaks',
    icon: '🔥',
    points: '+50 pts',
    desc: '3 correct in a row gives +5. Hit 10 and earn +50.',
  },
]

const SPORTS = ['NBA', 'NFL', 'Soccer']

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
        <span className="text-lg font-bold tracking-tight">Playcall</span>
        <div className="flex items-center gap-2">
          {SPORTS.map((s) => (
            <span key={s} className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-white/5 text-white/40 text-xs font-medium">
              {s}
            </span>
          ))}
          <div className="w-px h-4 bg-white/10 mx-2 hidden sm:block" />
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm bg-white text-black rounded-lg font-semibold hover:bg-white/90 transition-colors"
          >
            Sign up free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 pt-28 pb-24 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-white/40 text-xs mb-10 font-medium tracking-widest uppercase">
          No money. All skill.
        </div>

        <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
          Pick games.
          <br />
          <span className="text-sky-400">Earn bragging rights.</span>
        </h1>

        <p className="text-lg text-white/40 max-w-lg mx-auto leading-relaxed mb-10">
          Playcall gives you the thrill of sports betting without the financial spiral.
          Make picks, build streaks, and compete with friends on the leaderboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-7 py-3.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Start picking games
          </Link>
          <Link
            href="/leaderboard"
            className="w-full sm:w-auto px-7 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold text-sm border border-white/10 transition-colors"
          >
            View leaderboard
          </Link>
        </div>
      </section>

      {/* Scoring */}
      <section className="px-8 py-16 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-white/25 uppercase tracking-widest font-semibold mb-8 text-center">
            How scoring works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-2xl">{f.icon}</span>
                  <span className="text-xs font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-md">
                    {f.points}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1">{f.label}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-14 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to compete?</h2>
          <p className="text-white/40 text-sm mb-8">
            Free to join. No credit card. Pick your first game in under a minute.
          </p>
          <Link
            href="/signup"
            className="inline-flex px-8 py-3.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Create your account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-white/30">Playcall</span>
          <span className="text-xs text-white/20">Skill-based sports predictions</span>
        </div>
      </footer>
    </div>
  )
}
