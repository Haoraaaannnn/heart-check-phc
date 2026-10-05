import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (!value || options?.maxAge === 0) {
                cookieStore.set(name, '', {
                  path: '/',
                  maxAge: 0,
                  expires: new Date(0),
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                })
              } else {
                const sessionOptions = { ...options }
                delete sessionOptions.maxAge
                delete sessionOptions.expires
                cookieStore.set(name, value, {
                  ...sessionOptions,
                  path: '/',
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                })
              }
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // Handled via proxy.ts session refresh.
          }
        },
      },
    }
  )
}

