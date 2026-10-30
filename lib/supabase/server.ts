import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { fetchWithDeadline } from '@/lib/requestFetch'

export async function createClient() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const proto = headerStore.get('x-forwarded-proto')
  const isSecure =
    proto === 'https' ||
    headerStore.get('referer')?.startsWith('https:') ||
    headerStore.get('origin')?.startsWith('https:') ||
    false

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchWithDeadline },
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
                  secure: isSecure,
                })
              } else {
                const sessionOptions = { ...options }
                delete sessionOptions.maxAge
                delete sessionOptions.expires
                cookieStore.set(name, value, {
                  ...sessionOptions,
                  path: '/',
                  sameSite: 'lax',
                  secure: isSecure,
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

