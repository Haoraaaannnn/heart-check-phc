import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
   
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) throw authError

    
    const { data: existingUsers } = await supabaseAdmin.from('users').select('id')

    const existingIds = new Set(existingUsers?.map(u => u.id))

    
    const missingUsers = authUsers.users.filter(user => !existingIds.has(user.id))

    for (const user of missingUsers) {
      await supabaseAdmin.from('users').insert({
        id: user.id,
        email: user.email,
        username: user.email?.split('@')[0],
        role: 'registration' 
      })
    }

    return NextResponse.json({
      message: `Synced ${missingUsers.length} users`,
      synced: missingUsers.length
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}