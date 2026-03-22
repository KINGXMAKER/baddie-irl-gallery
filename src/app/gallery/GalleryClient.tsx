'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Lightbox from '@/components/Lightbox'
import type { Event, Photo } from '@/lib/types'

interface PhotoWithUrl extends Photo {
  url: string
}

function isVideo(url: string) {
  return url.match(/\.(mp4|mov|m4v)$/i)
}

// Generate a poster/thumbnail from a video URL using a hidden video + canvas
function useVideoPoster(url: string, enabled: boolean): string | undefined {
  const [poster, setPoster] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!enabled) return
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.currentTime = 0.5

    const handleSeeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 320
        canvas.height = video.videoHeight || 320
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          setPoster(canvas.toDataURL('image/jpeg', 0.7))
        }
      } catch {
        // CORS or other error — just skip poster
      }
      video.remove()
    }

    video.addEventListener('seeked', handleSeeked, { once: true })
    video.addEventListener('error', () => video.remove(), { once: true })
    video.src = url
    video.load()

    return () => {
      video.removeEventListener('seeked', handleSeeked)
      video.remove()
    }
  }, [url, enabled])

  return poster
}

interface GalleryClientProps {
  event: Event
  photos: PhotoWithUrl[]
}

export default function GalleryClient({ event, photos }: GalleryClientProps) {
  const router = useRouter()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  const featured = photos.filter(p => p.is_featured)
  const rest = photos.filter(p => !p.is_featured)
  const orderedPhotos = [...featured, ...rest]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-night-border/50 sticky top-0 bg-night/80 backdrop-blur-xl z-20">
        <button
          onClick={() => router.back()}
          className="text-champagne/40 hover:text-champagne/60 transition p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
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
          <div className="gallery-grid">
            {orderedPhotos.map((photo, index) => (
              <VideoAwareCard
                key={photo.id}
                photo={photo}
                index={index}
                loadedImages={loadedImages}
                setLoadedImages={setLoadedImages}
                onSelect={setLightboxIndex}
              />
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && orderedPhotos[lightboxIndex] && (
        <Lightbox
          src={orderedPhotos[lightboxIndex].url}
          alt={orderedPhotos[lightboxIndex].uploader_name || undefined}
          instagramHandle={orderedPhotos[lightboxIndex].instagram_handle || undefined}
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

// Separate component so each video card can use the useVideoPoster hook
function VideoAwareCard({
  photo,
  index,
  loadedImages,
  setLoadedImages,
  onSelect,
}: {
  photo: PhotoWithUrl
  index: number
  loadedImages: Set<string>
  setLoadedImages: React.Dispatch<React.SetStateAction<Set<string>>>
  onSelect: (index: number) => void
}) {
  const isVid = isVideo(photo.url)
  const poster = useVideoPoster(photo.url, !!isVid)

  // For videos, mark as loaded immediately since we show poster/gradient
  useEffect(() => {
    if (isVid) {
      setLoadedImages(prev => new Set(prev).add(photo.id))
    }
  }, [isVid, photo.id, setLoadedImages])

  return (
    <div className="gallery-item">
      {/* Square thumbnail — tappable */}
      <div
        onClick={() => onSelect(index)}
        className="relative group cursor-pointer rounded-xl overflow-hidden bg-night-card aspect-square"
      >
        {/* Image or Video */}
        {isVid ? (
          <>
            {/* Poster image as background — always visible */}
            {poster && (
              <img
                src={poster}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Video element — plays on hover (desktop) */}
            <video
              src={`${photo.url}#t=0.1`}
              loop
              muted
              playsInline
              preload="metadata"
              poster={poster}
              onMouseEnter={e => {
                const v = e.currentTarget
                v.currentTime = 0
                v.play().catch(() => {})
              }}
              onMouseLeave={e => {
                e.currentTarget.pause()
                e.currentTarget.currentTime = 0
              }}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03]"
            />
            {/* Video play icon */}
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white z-10 pointer-events-none">
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

        {/* Loading shimmer — only for images */}
        {!isVid && !loadedImages.has(photo.id) && (
          <div className="absolute inset-0 img-loading" />
        )}

        {/* Featured badge */}
        {photo.is_featured && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-gold/90 text-black text-[9px] font-bold uppercase tracking-wider">
            Featured
          </div>
        )}

        {/* Bottom gradient for visibility */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      {/* Instagram handle — always visible below thumbnail */}
      {photo.instagram_handle && (
        <a
          href={`https://instagram.com/${photo.instagram_handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 mt-2 px-1 group/handle"
        >
          <svg className="w-3 h-3 text-champagne/30 group-hover/handle:text-blush transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
          <span className="text-[11px] text-champagne/40 font-medium group-hover/handle:text-blush transition-colors truncate">
            @{photo.instagram_handle}
          </span>
        </a>
      )}
    </div>
  )
}
