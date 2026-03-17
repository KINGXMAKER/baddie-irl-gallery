'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPublicUrl } from '@/lib/utils'
import type { Photo } from '@/lib/types'
import Link from 'next/link'

interface PhotoWithUrl extends Photo {
  url: string
}

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([])
  const [loading, setLoading] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const authenticate = () => {
    // Check against API route
    fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          sessionStorage.setItem('admin_token', data.token)
          setIsAuthed(true)
        } else {
          showToast('Wrong passcode')
        }
      })
  }

  const getToken = () => sessionStorage.getItem('admin_token') || ''

  const fetchPhotos = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/photos?token=${getToken()}`)
      const { data: allPhotos } = await res.json()

      const withUrls = (allPhotos || []).map((p: Photo) => ({
        ...p,
        url: getPublicUrl(p.storage_path),
      }))

      setPhotos(withUrls)
    } catch (err) {
      console.error('Failed to fetch photos:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isAuthed) fetchPhotos()
  }, [isAuthed, fetchPhotos])

  const toggleHidden = async (photoId: string, currentlyHidden: boolean) => {
    const res = await fetch('/api/admin/photos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: getToken(), photoId, action: 'toggle_hidden', value: !currentlyHidden }),
    })
    if (res.ok) {
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, is_hidden: !currentlyHidden } : p))
      showToast(currentlyHidden ? 'Photo unhidden' : 'Photo hidden')
    }
  }

  const toggleFeatured = async (photoId: string, currentlyFeatured: boolean) => {
    const res = await fetch('/api/admin/photos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: getToken(), photoId, action: 'toggle_featured', value: !currentlyFeatured }),
    })
    if (res.ok) {
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, is_featured: !currentlyFeatured } : p))
      showToast(currentlyFeatured ? 'Removed from featured' : 'Marked as featured')
    }
  }

  const deletePhoto = async (photoId: string, storagePath: string) => {
    if (!confirm('Permanently delete this photo?')) return
    const res = await fetch('/api/admin/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: getToken(), photoId, storagePath }),
    })
    if (res.ok) {
      setPhotos(prev => prev.filter(p => p.id !== photoId))
      showToast('Photo deleted')
    }
  }

  // Login screen
  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-xs space-y-6 text-center">
          <div>
            <h1 className="text-xl font-bold text-champagne-light">Admin Access</h1>
            <p className="text-xs text-champagne/30 mt-1">Enter the event passcode</p>
          </div>
          <input
            type="password"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && authenticate()}
            placeholder="Passcode"
            className="w-full bg-night-card border border-night-border rounded-xl py-3 px-4 text-sm text-champagne text-center tracking-widest placeholder-champagne/20 focus:outline-none focus:border-blush/50 transition"
            autoFocus
          />
          <button
            onClick={authenticate}
            className="w-full py-3 rounded-xl bg-blush hover:bg-blush/90 text-white font-semibold text-sm transition"
          >
            Enter
          </button>
        </div>
      </div>
    )
  }

  const displayed = showHidden ? photos : photos.filter(p => !p.is_hidden)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-night-card border border-night-border rounded-xl px-5 py-2.5 text-sm font-medium text-champagne shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-night-border/50 sticky top-0 bg-night/80 backdrop-blur-xl z-20">
        <Link href="/" className="text-champagne/40 hover:text-champagne/60 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-sm font-semibold text-champagne/60 tracking-wider uppercase">Admin Panel</h1>
        <button
          onClick={() => setShowHidden(!showHidden)}
          className={`text-xs font-semibold transition ${showHidden ? 'text-blush' : 'text-champagne/30'}`}
        >
          {showHidden ? 'Hide Hidden' : 'Show Hidden'}
        </button>
      </header>

      {/* Stats bar */}
      <div className="px-5 py-3 flex gap-4 text-[11px] font-semibold text-champagne/40 border-b border-night-border/30">
        <span>{photos.length} total</span>
        <span>{photos.filter(p => p.is_featured).length} featured</span>
        <span>{photos.filter(p => p.is_hidden).length} hidden</span>
      </div>

      {/* Grid */}
      <main className="flex-1 px-3 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-blush border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {displayed.map(photo => (
              <div key={photo.id} className={`relative group rounded-xl overflow-hidden bg-night-card ${photo.is_hidden ? 'opacity-40' : ''}`}>
                <div className="aspect-square">
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Badges */}
                <div className="absolute top-1.5 left-1.5 flex gap-1">
                  {photo.is_featured && (
                    <span className="px-1.5 py-0.5 rounded bg-gold/90 text-black text-[8px] font-bold uppercase">Featured</span>
                  )}
                  {photo.is_hidden && (
                    <span className="px-1.5 py-0.5 rounded bg-red-500/80 text-white text-[8px] font-bold uppercase">Hidden</span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                  <button
                    onClick={() => toggleFeatured(photo.id, photo.is_featured)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition ${
                      photo.is_featured ? 'bg-gold text-black' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {photo.is_featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button
                    onClick={() => toggleHidden(photo.id, photo.is_hidden)}
                    className="flex-1 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-bold hover:bg-white/20 transition"
                  >
                    {photo.is_hidden ? 'Unhide' : 'Hide'}
                  </button>
                  <button
                    onClick={() => deletePhoto(photo.id, photo.storage_path)}
                    className="px-2 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/30 transition"
                  >
                    Del
                  </button>
                </div>

                {/* Uploader name */}
                {photo.uploader_name && (
                  <div className="absolute top-1.5 right-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-black/60 text-white/70 text-[9px]">{photo.uploader_name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
