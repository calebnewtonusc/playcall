import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-7xl font-black text-white/10 mb-4">404</p>
        <h1 className="text-xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-white/40 text-sm mb-6">This page doesn&apos;t exist or was moved.</p>
        <Link
          href="/"
          className="inline-flex px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-semibold transition"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
