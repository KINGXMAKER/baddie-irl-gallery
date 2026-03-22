'use client'

import { useState, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase'
import { validateFile, formatFileSize, cn } from '@/lib/utils'

interface UploadItem {
  id: string
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

interface UploadZoneProps {
  eventId: string
  onUploadComplete?: () => void
}

export default function UploadZone({ eventId, onUploadComplete }: UploadZoneProps) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [instagramHandle, setInstagramHandle] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: UploadItem[] = []
    Array.from(files).forEach(file => {
      const error = validateFile(file)
      newItems.push({
        id: uuidv4(),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: error ? 'error' : 'pending',
        error: error || undefined,
      })
    })
    setItems(prev => [...prev, ...newItems])
  }, [])

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  const removeItem = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter(i => i.id !== id)
    })
  }

  const uploadAll = async () => {
    const pending = items.filter(i => i.status === 'pending')
    if (!pending.length) return

    for (const item of pending) {
      setItems(prev =>
        prev.map(i => i.id === item.id ? { ...i, status: 'uploading' as const, progress: 10 } : i)
      )

      try {
        const ext = item.file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const storagePath = `${eventId}/${uuidv4()}.${ext}`

        // Upload to Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('event-photos')
          .upload(storagePath, item.file, {
            contentType: item.file.type,
            upsert: false,
          })

        if (storageError) throw storageError

        setItems(prev =>
          prev.map(i => i.id === item.id ? { ...i, progress: 60 } : i)
        )

        // Get image dimensions
        const dimensions = await getImageDimensions(item.preview)

        // Clean up the instagram handle
        const cleanHandle = instagramHandle.trim().replace(/^@/, '')

        // Insert DB record
        const { error: dbError } = await supabase
          .from('photos')
          .insert({
            event_id: eventId,
            storage_path: storagePath,
            thumbnail_path: null,
            uploader_name: cleanHandle || null,
            instagram_handle: cleanHandle || null,
            is_featured: false,
            is_hidden: false,
            width: dimensions.width,
            height: dimensions.height,
            file_size: item.file.size,
          })

        if (dbError) throw dbError

        setItems(prev =>
          prev.map(i => i.id === item.id ? { ...i, status: 'done' as const, progress: 100 } : i)
        )
      } catch (err) {
        console.error('Upload failed:', err)
        setItems(prev =>
          prev.map(i =>
            i.id === item.id
              ? { ...i, status: 'error' as const, error: 'Upload failed. Try again.' }
              : i
          )
        )
      }
    }

    onUploadComplete?.()
  }

  const pendingCount = items.filter(i => i.status === 'pending').length
  const doneCount = items.filter(i => i.status === 'done').length
  const isUploading = items.some(i => i.status === 'uploading')

  return (
    <div className="space-y-6">
      {/* Instagram handle input */}
      <div>
        <label className="block text-[11px] font-semibold text-champagne/40 uppercase tracking-widest mb-2">
          Instagram Handle <span className="text-champagne/20">(so we can tag you)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-champagne/30 font-medium">@</span>
          <input
            type="text"
            value={instagramHandle}
            onChange={e => setInstagramHandle(e.target.value.replace(/^@/, ''))}
            placeholder="yourhandle"
            className="w-full bg-night-card border border-night-border rounded-xl py-3 pl-8 pr-4 text-sm text-champagne placeholder-champagne/25 focus:outline-none focus:border-blush/50 transition"
          />
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={e => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center min-h-[220px] rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300',
          isDragging
            ? 'upload-zone-active border-blush'
            : 'border-night-border hover:border-champagne/20 bg-night-card/50 hover:bg-night-card'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/x-m4v"
          multiple
          className="hidden"
          onChange={e => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = ''
          }}
        />

        <div className="flex flex-col items-center gap-4 p-8">
          <div className={cn(
            'p-4 rounded-full transition-colors',
            isDragging ? 'bg-blush/15' : 'bg-night-elevated'
          )}>
            <svg className={cn('w-8 h-8 transition-colors', isDragging ? 'text-blush' : 'text-champagne/30')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-champagne/80">
              {isDragging ? 'Drop them here' : 'Drop your best content'}
            </p>
            <p className="text-xs text-champagne/30 mt-1">
              or tap to select from your camera roll
            </p>
            <p className="text-[10px] text-champagne/15 mt-2">
              Images & Videos (MP4, MOV) up to 50MB
            </p>
          </div>
        </div>
      </div>

      {/* Staged files */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-champagne/50 uppercase tracking-wider">
              {doneCount > 0 && `${doneCount} uploaded`}
              {doneCount > 0 && pendingCount > 0 && ' · '}
              {pendingCount > 0 && `${pendingCount} ready`}
            </p>
            {items.some(i => i.status === 'done') && (
              <button
                onClick={() => setItems(prev => prev.filter(i => i.status !== 'done'))}
                className="text-[10px] text-champagne/30 hover:text-champagne/50 transition"
              >
                Clear completed
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {items.map(item => (
              <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-square bg-night-card">
                {item.file.type.startsWith('video/') ? (
                  <video
                    src={item.preview}
                    className={cn(
                      'w-full h-full object-cover transition-opacity',
                      item.status === 'uploading' && 'opacity-50',
                      item.status === 'error' && 'opacity-30'
                    )}
                  />
                ) : (
                  <img
                    src={item.preview}
                    alt=""
                    className={cn(
                      'w-full h-full object-cover transition-opacity',
                      item.status === 'uploading' && 'opacity-50',
                      item.status === 'error' && 'opacity-30'
                    )}
                  />
                )}

                {/* Progress overlay */}
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-blush border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Done checkmark */}
                {item.status === 'done' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Error overlay */}
                {item.status === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                    <span className="text-red-400 text-lg">!</span>
                    <span className="text-red-400 text-[9px] text-center leading-tight mt-1">{item.error}</span>
                  </div>
                )}

                {/* Remove button */}
                {(item.status === 'pending' || item.status === 'error') && (
                  <button
                    onClick={e => { e.stopPropagation(); removeItem(item.id) }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* File size */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                  <span className="text-[9px] text-white/60">{formatFileSize(item.file.size)}</span>
                </div>

                {/* Progress bar */}
                {item.status === 'uploading' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                    <div className="progress-fill h-full rounded-full" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Upload button */}
          {pendingCount > 0 && (
            <button
              onClick={uploadAll}
              disabled={isUploading}
              className={cn(
                'w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2',
                isUploading
                  ? 'bg-night-elevated text-champagne/40 cursor-wait'
                  : 'bg-blush hover:bg-blush/90 text-white shadow-lg shadow-blush/20'
              )}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  Upload {pendingCount} Photo{pendingCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise(resolve => {
    // Basic detection for video URL
    if (src.startsWith('blob:')) {
      // It's tricky to know if blob is video without type, but we can try loading as image first
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => resolve({ width: 0, height: 0 })
      img.src = src
    } else {
      resolve({ width: 0, height: 0 })
    }
  })
}
