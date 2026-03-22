import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blush/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full bg-gold/5 blur-[100px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 max-w-lg mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-night-border bg-night-card text-xs font-medium tracking-wider uppercase text-gold">
            <span className="w-1.5 h-1.5 rounded-full bg-blush animate-pulse" />
            Live Gallery
          </div>

          {/* Title */}
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight text-champagne-light">
            Baddie IRL
            <span className="block text-blush">Content Day</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-champagne/60 max-w-sm mx-auto leading-relaxed">
            Drop your best photos & videos from Baddie IRL<br />
            we&apos;ll post the 🔥 ones and tag you.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/upload"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-blush hover:bg-blush/90 text-white font-semibold text-sm tracking-wide transition-all active:scale-[0.97] shadow-lg shadow-blush/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Upload Your Content
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-night-border bg-night-card hover:bg-night-elevated text-champagne font-semibold text-sm tracking-wide transition-all active:scale-[0.97]"
            >
              View Gallery
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-champagne/30 tracking-wider uppercase">
        Bad Bitches Only
      </footer>
    </div>
  )
}
