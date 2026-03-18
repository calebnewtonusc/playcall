import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <span className="text-xl font-bold text-white tracking-tight">Playcall</span>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm text-white/70 hover:text-white transition">
            Log in
          </Link>
          <Link href="/signup" className="px-4 py-2 text-sm bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-medium transition">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm mb-8">
          No money. All thrill.
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 max-w-4xl">
          Predict games.<br />
          <span className="text-sky-400">Win bragging rights.</span>
        </h1>
        <p className="text-lg text-white/50 max-w-xl mb-10">
          Playcall replaces the addictive loop of sports betting with skill-based competition.
          Make picks, build streaks, climb leaderboards — no wallet required.
        </p>
        <div className="flex gap-4">
          <Link href="/signup" className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-semibold text-lg transition">
            Start picking
          </Link>
          <Link href="/leaderboard" className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold text-lg border border-white/10 transition">
            See leaderboard
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 border-t border-white/10">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🎯', title: 'Accuracy Points', desc: 'Get 10 pts for every correct pick. Simple, fair, addictive.' },
            { icon: '⚡', title: 'Boldness Multiplier', desc: 'Pick the underdog and multiply your points. Risk it all.' },
            { icon: '🔥', title: 'Streak Bonus', desc: '3 in a row? +5. 10 in a row? +50. Keep the streak alive.' },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
