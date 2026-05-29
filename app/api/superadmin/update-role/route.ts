import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(request: Request) {
  try {
    const { authId, email, username, role } = await request.json()

    if (!authId) {
      return NextResponse.json(
        { error: 'Auth ID is required' },
        { status: 400 }
      )
    }

   
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ 
        email: email,
        username: username,
        role: role 
      })
      .eq('auth_id', authId)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    
    if (email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        authId,
        { email: email }
      )
      if (authError) {
        console.error('Error updating auth email:', authError)
        
      }
    }

    return NextResponse.json(
      { success: true, message: 'User updated successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}