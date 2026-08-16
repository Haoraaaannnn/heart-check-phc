import { NextResponse } from 'next/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'

const supabaseAdmin = createAdminSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function requireSuperadmin(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    }
  }

  const { data: { user }, error: authCheckError } = await supabaseAdmin.auth.getUser(token)

  if (authCheckError || !user) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
    }
  }

  const { data: callerProfile, error: roleError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (roleError || !callerProfile || callerProfile.role !== 'superadmin') {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { authorized: true as const, user }
}