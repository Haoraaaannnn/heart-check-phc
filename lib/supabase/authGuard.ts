// lib/supabase/authGuard.ts
import { NextResponse } from 'next/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'

const supabaseAdmin = createAdminSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function requireUser(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    }
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    }
  }

  return { authorized: true as const, user, token }
}