'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import UploadClient from './UploadClient'

export default function UploadPage() {
  const [eventId, setEventId] = useState<string | null>(null)
  const [eventName, setEventName] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchEvent() {
      const eventSlug = process.env.NEXT_PUBLIC_EVENT_SLUG || 'baddie-irl-content-day'
      const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('slug', eventSlug)
        .single()

      if (event) {
        setEventId(event.id)
        setEventName(event.name)
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }
    fetchEvent()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blush border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !eventId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-2xl">📸</p>
          <p className="text-champagne/60 text-sm">Event not found. Check back soon.</p>
        </div>
      </div>
    )
  }

  return <UploadClient eventId={eventId} eventName={eventName} />
}
