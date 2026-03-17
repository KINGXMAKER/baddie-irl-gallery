'use client'

import Link from 'next/link'
import UploadZone from '@/components/UploadZone'
import { useState } from 'react'

interface UploadClientProps {
  eventId: string
  eventName: string
}

export default function UploadClient({ eventId, eventName }: UploadClientProps) {
  const [uploadCount, setUploadCount] = useState(0)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-night-border/50">
        <Link href="/" className="text-champagne/40 hover:text-champagne/60 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-sm font-semibold text-champagne/60 tracking-wider uppercase">{eventName}</h1>
        <Link href="/gallery" className="text-xs text-blush font-semibold hover:text-blush/80 transition">
          Gallery
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 px-5 py-8 max-w-lg mx-auto w-full">
        <div className="space-y-2 mb-8">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-champagne-light">
            Add your shots
          </h2>
          <p className="text-sm text-champagne/40">
            Upload your content from tonight. It goes straight to the gallery.
          </p>
        </div>

        <UploadZone
          eventId={eventId}
          onUploadComplete={() => setUploadCount(c => c + 1)}
        />

        {uploadCount > 0 && (
          <div className="mt-8 p-4 rounded-xl bg-night-card border border-night-border text-center space-y-3">
            <p className="text-sm text-champagne/60">Photos uploaded successfully</p>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-night-elevated border border-night-border text-champagne text-sm font-semibold hover:bg-night-border transition"
            >
              View Gallery
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
