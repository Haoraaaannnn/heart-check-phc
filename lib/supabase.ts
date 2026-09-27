/**
 * @fileoverview Universal browser Supabase client using @supabase/ssr.
 *
 * Persists session tokens to cookies so they are sent to Next.js Edge proxy/middleware
 * and Server Components, preventing unauthorized redirects after client-side authentication.
 *
 * @module lib/supabase
 */

import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);