'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import GalleryClient from './GalleryClient'
import { getPublicUrl } from '@/lib/utils'
import type { Event, Photo } from '@/lib/types'

interface PhotoWithUrl extends Photo {
  url: string
}

export default function GalleryPage() {
  const [event, setEvent] = useState<Event | null>(null)
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const eventSlug = process.env.NEXT_PUBLIC_EVENT_SLUG || 'baddie-irl-content-day'

      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('slug', eventSlug)
        .single()

      if (!eventData) {
        setLoading(false)
        return
      }

      setEvent(eventData as Event)

      const { data: photosData } = await supabase
        .from('photos')
        .select('*')
        .eq('event_id', eventData.id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })

      const withUrls = ((photosData || []) as Photo[]).map(p => ({
        ...p,
        url: getPublicUrl(p.storage_path),
      }))

      setPhotos(withUrls)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blush border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-2xl">📸</p>
          <p className="text-champagne/60 text-sm">Event not found.</p>
        </div>
      </div>
    )
  }

  return <GalleryClient event={event} photos={photos} />
}
