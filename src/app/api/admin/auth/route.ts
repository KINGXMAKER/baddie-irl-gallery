import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const { passcode } = await request.json()
  const adminPasscode = process.env.ADMIN_PASSCODE

  if (!adminPasscode || passcode !== adminPasscode) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  // Generate a simple session token
  const token = crypto.randomBytes(32).toString('hex')

  // Store token in a cookie as well for API auth
  const response = NextResponse.json({ success: true, token })
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 hours
  })

  // Store token server-side (in-memory for MVP — resets on redeploy)
  globalThis.__adminTokens = globalThis.__adminTokens || new Set()
  globalThis.__adminTokens.add(token)

  // Clean up old tokens (keep last 10)
  if (globalThis.__adminTokens.size > 10) {
    const arr = Array.from(globalThis.__adminTokens)
    globalThis.__adminTokens = new Set(arr.slice(-10))
  }

  return response
}

// Type augmentation for global token store
declare global {
  // eslint-disable-next-line no-var
  var __adminTokens: Set<string> | undefined
}
