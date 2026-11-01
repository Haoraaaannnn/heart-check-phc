import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null)
    const token_hash: unknown = typeof body === 'object' && body !== null && 'token_hash' in body ? body.token_hash : null
    const type: unknown = typeof body === 'object' && body !== null && 'type' in body ? body.type : null

    if (typeof token_hash !== 'string' || !token_hash || type !== 'recovery') {
      return NextResponse.json({ error: 'Invalid recovery request.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash })

    if (error) {
      return NextResponse.json({ error: 'Invalid or expired recovery link. Please request a new one.' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Recovery verification service unavailable.' }, { status: 500 })
  }
}