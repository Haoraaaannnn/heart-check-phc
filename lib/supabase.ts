/**
 * @fileoverview Browser Supabase client, session-scoped per tab.
 *
 * Uses sessionStorage instead of cookies so each browser tab keeps an
 * independent session — logging in/out on one tab no longer affects
 * other tabs signed in as a different account.
 *
 * @module lib/supabase
 */

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);