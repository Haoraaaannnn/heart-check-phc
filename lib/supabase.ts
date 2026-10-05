/**
 * @fileoverview Browser Supabase client, session-scoped per tab.
 *
 * Uses sessionStorage instead of cookies so each browser tab keeps an
 * independent session — logging in/out on one tab no longer affects
 * other tabs signed in as a different account.
 *
 * @module lib/supabase
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase browser client instance configured for session-scoped cookies and weak-signal resilience.
 *
 * @remarks
 * Uses true HTTP session cookies (omitting maxAge and expires on active tokens) so that authentication
 * is bounded strictly to the active browser session, preventing lingering credentials on shared hospital
 * terminals. When cookies are removed (maxAge === 0 or empty value), they are explicitly expired immediately.
 *
 * The `realtime` block is tuned specifically for the PHC demo environment where
 * all devices share a single WiFi access point with a degraded internet uplink.
 *
 * - `heartbeatIntervalMs` (25 000): Sends WebSocket keep-alive pings every 25 seconds.
 *   Slightly faster than the server-side default (30s) so the client detects dead
 *   connections before the server does, enabling faster fallback to polling.
 *
 * - `timeout` (60 000): Time in milliseconds the client waits for a heartbeat
 *   acknowledgement before declaring the channel `TIMED_OUT`. The default (40s)
 *   is too aggressive on weak connections — a single delayed heartbeat round-trip
 *   causes premature channel teardown and reconnect storms. 60 seconds gives the
 *   flaky uplink enough breathing room while still detecting genuine disconnects.
 *
 * - `reconnectAfterMs`: Exponential backoff capped at 10 seconds. Prevents the
 *   client from hammering the server with reconnect attempts when the uplink is
 *   saturated. The 2-second floor avoids tight reconnect loops that would
 *   compete with polling for bandwidth.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    isSingleton: true,
    cookies: {
      getAll() {
        if (typeof document === 'undefined') return [];
        return document.cookie
          .split(';')
          .filter(Boolean)
          .map((c) => {
            const [name, ...val] = c.trim().split('=');
            return { name, value: decodeURIComponent(val.join('=')) };
          });
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return;
        cookiesToSet.forEach(({ name, value, options }) => {
          const restOptions = { ...options };
          delete restOptions.maxAge;
          delete restOptions.expires;
          if (!value || options?.maxAge === 0) {
            document.cookie = `${name}=; path=${restOptions.path || '/'}; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
          } else {
            let cookieStr = `${name}=${encodeURIComponent(value)}; path=${restOptions.path || '/'}; SameSite=${restOptions.sameSite || 'Lax'}`;
            if (process.env.NODE_ENV === 'production' || restOptions.secure) {
              cookieStr += '; Secure';
            }
            document.cookie = cookieStr;
          }
        });
      },
    },
    realtime: {
      heartbeatIntervalMs: 25_000,
      timeout: 60_000,
      reconnectAfterMs: (attempts: number) => {
        return Math.min(2_000 * Math.pow(1.5, attempts), 10_000);
      },
    },
  }
);