import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service-role-like access for admin operations
// For MVP, we use the anon key but validate the admin token
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function isValidToken(token: string): boolean {
  globalThis.__adminTokens = globalThis.__adminTokens || new Set()
  return globalThis.__adminTokens.has(token)
}

// GET — list all photos (including hidden) for admin
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || ''
  if (!isValidToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const eventSlug = process.env.NEXT_PUBLIC_EVENT_SLUG || 'baddie-irl-content-day'

  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('slug', eventSlug)
    .single()

  if (!event) {
    return NextResponse.json({ data: [] })
  }

  // Note: RLS may block hidden photos with anon key.
  // For full admin, use SUPABASE_SERVICE_ROLE_KEY.
  // MVP workaround: create a separate "admin read" RLS policy or use service key.
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ data: photos })
}

// PATCH — toggle featured / hidden
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { token, photoId, action, value } = body

  if (!isValidToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  if (action === 'toggle_featured') {
    const { error } = await supabase
      .from('photos')
      .update({ is_featured: value })
      .eq('id', photoId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (action === 'toggle_hidden') {
    const { error } = await supabase
      .from('photos')
      .update({ is_hidden: value })
      .eq('id', photoId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE — permanently delete photo
export async function DELETE(request: NextRequest) {
  const body = await request.json()
  const { token, photoId, storagePath } = body

  if (!isValidToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  // Delete from storage
  await supabase.storage.from('event-photos').remove([storagePath])

  // Delete from DB
  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

declare global {
  // eslint-disable-next-line no-var
  var __adminTokens: Set<string> | undefined
}
