'use client'

import { useState } from 'react'
import Link from 'next/link'
import Lightbox from '@/components/Lightbox'
import type { Event, Photo } from '@/lib/types'

interface PhotoWithUrl extends Photo {
  url: string
}

function isVideo(url: string) {
  return url.match(/\.(mp4|mov|m4v)$/i)
}

interface GalleryClientProps {
  event: Event
  photos: PhotoWithUrl[]
}

export default function GalleryClient({ event, photos }: GalleryClientProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  const featured = photos.filter(p => p.is_featured)
  const rest = photos.filter(p => !p.is_featured)
  const orderedPhotos = [...featured, ...rest]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-night-border/50 sticky top-0 bg-night/80 backdrop-blur-xl z-20">
        <Link href="/" className="text-champagne/40 hover:text-champagne/60 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="text-center">
          <h1 className="text-sm font-semibold text-champagne/60 tracking-wider uppercase">{event.name}</h1>
          <p className="text-[10px] text-champagne/25">{orderedPhotos.length} photo{orderedPhotos.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/upload" className="text-xs text-blush font-semibold hover:text-blush/80 transition">
          + Add
        </Link>
      </header>

      {/* Gallery */}
      <main className="flex-1 px-3 sm:px-5 py-5">
        {orderedPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
            <div className="text-4xl">📷</div>
            <p className="text-champagne/40 text-sm">No photos yet. Be the first to upload.</p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blush text-white text-sm font-semibold hover:bg-blush/90 transition"
            >
              Upload Photos
            </Link>
          </div>
        ) : (
          <div className="masonry">
            {orderedPhotos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                className="relative group cursor-pointer rounded-xl overflow-hidden bg-night-card"
              >
                {/* Aspect ratio placeholder */}
                {photo.width && photo.height ? (
                  <div style={{ paddingBottom: `${(photo.height / photo.width) * 100}%` }} />
                ) : (
                  <div style={{ paddingBottom: '100%' }} />
                )}

                {/* Image or Video */}
                {isVideo(photo.url) ? (
                  <>
                    <video
                      src={photo.url}
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      onLoadedData={() => setLoadedImages(prev => new Set(prev).add(photo.id))}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03] ${
                        loadedImages.has(photo.id) ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    {/* Video indicator icon */}
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white z-10 group-hover:opacity-0 transition-opacity">
                      <svg className="w-3 h-3 translate-x-[1px]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <img
                    src={photo.url}
                    alt={photo.uploader_name ? `Photo by ${photo.uploader_name}` : 'Event photo'}
                    loading="lazy"
                    onLoad={() => setLoadedImages(prev => new Set(prev).add(photo.id))}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03] ${
                      loadedImages.has(photo.id) ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                )}

                {/* Loading shimmer */}
                {!loadedImages.has(photo.id) && (
                  <div className="absolute inset-0 img-loading" />
                )}

                {/* Featured badge */}
                {photo.is_featured && (
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-gold/90 text-black text-[9px] font-bold uppercase tracking-wider">
                    Featured
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {photo.uploader_name && (
                    <div className="absolute bottom-2 left-2.5">
                      <p className="text-[11px] text-white/80 font-medium">{photo.uploader_name}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && orderedPhotos[lightboxIndex] && (
        <Lightbox
          src={orderedPhotos[lightboxIndex].url}
          alt={orderedPhotos[lightboxIndex].uploader_name || undefined}
          onClose={() => setLightboxIndex(null)}
          onPrev={lightboxIndex > 0 ? () => setLightboxIndex(lightboxIndex - 1) : undefined}
          onNext={lightboxIndex < orderedPhotos.length - 1 ? () => setLightboxIndex(lightboxIndex + 1) : undefined}
        />
      )}

      {/* Footer */}
      <footer className="text-center py-6 border-t border-night-border/30">
        <p className="text-[10px] text-champagne/20 uppercase tracking-widest">Bad Bitches Only</p>
      </footer>
    </div>
  )
}
