/**
 * @file middleware.ts
 * @description Next.js Edge Middleware providing server-side route-level access control.
 *
 * This middleware intercepts every incoming HTTP request for protected route segments
 * before Next.js renders or delivers any HTML to the browser. It validates the
 * Supabase session cookie and checks the caller's role from the `users` table
 * against the required roles for the matched route prefix.
 *
 * Two-layer security architecture:
 * - Layer 1 (this file): Server-side middleware — blocks unauthenticated or
 *   unauthorized requests before page delivery. Cannot be bypassed by disabling
 *   JavaScript on the client.
 * - Layer 2 (client-side): `lib/supabase/authGuard.ts` and role guard hooks —
 *   in-page UI conditionals used as a secondary guard for granular in-page access.
 *
 * @remarks
 * Role routing map (as defined in `docs/SECURITY.md`):
 * - /superadmin  - superadmin only
 * - /dashboard   - admin, superadmin
 * - /nurse       - nurse, staff, admin, superadmin
 * - /transfer    - nurse, staff, admin, superadmin
 * - /kiosk       - public, no auth check
 * - /monitor     - public, no auth check
 * - /login       - public
 *
 * The join column for the `users` table is `auth_id` (matches `auth.uid()`),
 * NOT the `id` primary key. See `docs/DATABASE_SCHEMA.md`.
 *
 * @see docs/SECURITY.md
 * @see docs/CHANGES_NEEDED.md
 * @module middleware
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Maps protected route prefixes to the set of roles permitted to access them.
 *
 * @remarks
 * Role values must exactly match the string values stored in `users.role`
 * in the Supabase database (case-sensitive). Confirm against the live database
 * before modifying, as mismatches silently fail every policy check.
 *
 * Design decision: `admin` and `superadmin` are permitted on `/nurse` and
 * `/transfer` for oversight and support access. If admins should be fully
 * separated from nurse/transfer workflows in the future, remove them from
 * those arrays.
 */
const ROLE_ROUTES: Record<string, string[]> = {
    "/superadmin": ["superadmin"],
    "/dashboard": ["admin", "superadmin"],
    "/nurse": ["nurse", "staff", "admin", "superadmin"],
    "/transfer": ["nurse", "staff", "admin", "superadmin"],
};

/**
 * Next.js Edge Middleware function.
 *
 * Intercepts requests for protected routes, validates the Supabase session,
 * and enforces role-based access control before the page is rendered.
 *
 * @remarks
 * The Supabase SSR client reads and refreshes session cookies on every request,
 * keeping auth tokens fresh without requiring client-side token refresh logic.
 *
 * Redirect behavior:
 * - Unauthenticated user accessing a protected route: redirected to `/login`.
 * - Authenticated user with insufficient role: redirected to `/unauthorized`.
 *
 * @param request - The incoming Next.js edge request object.
 * @returns A `NextResponse` — either passing the request through, or redirecting.
 */
export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request });

    /**
     * Create a Supabase SSR server client that reads from and writes to
     * the request/response cookie store, keeping the session token refreshed.
     */
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                /**
                 * Reads all cookies from the incoming request.
                 * @returns The full cookie list from the request.
                 */
                getAll() {
                    return request.cookies.getAll();
                },

                /**
                 * Writes refreshed session cookies to both the request (for
                 * downstream server components) and the response (for the browser).
                 *
                 * @param cookiesToSet - Array of cookie name/value/options tuples.
                 */
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    );
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    /**
     * Retrieve the currently authenticated user from the Supabase session cookie.
     * `getUser()` validates the session server-side — it cannot be spoofed by
     * manipulating client-side state.
     */
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    /**
     * Find the first matching protected route prefix for the current request path.
     * If no prefix matches, the route is public and no auth check is performed.
     */
    const matchedPrefix = Object.keys(ROLE_ROUTES).find((prefix) =>
        path.startsWith(prefix),
    );

    if (matchedPrefix) {
        /**
         * Route is protected. If there is no authenticated user, redirect to login.
         */
        if (!user) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        /**
         * User is authenticated. Fetch their role from the `users` table.
         * Join must use `auth_id` (matches `auth.uid()`), NOT the table's `id`
         * primary key. See docs/DATABASE_SCHEMA.md.
         */
        const { data: userRow } = await supabase
            .from("users")
            .select("role")
            .eq("auth_id", user.id)
            .single();

        /**
         * If the role lookup fails, or the user's role is not in the allowed list
         * for this route, redirect to the unauthorized page.
         */
        if (!userRow || !ROLE_ROUTES[matchedPrefix].includes(userRow.role)) {
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
    }

    return response;
}

/**
 * Next.js middleware route matcher configuration.
 *
 * @remarks
 * Limits the middleware to only run on protected route segments.
 * Public routes (`/kiosk`, `/monitor`, `/login`, `/auth`, API routes,
 * and static assets) are excluded from middleware entirely to avoid
 * unnecessary session lookups on every public page load.
 */
export const config = {
    matcher: [
        "/superadmin/:path*",
        "/dashboard/:path*",
        "/nurse/:path*",
        "/transfer/:path*",
    ],
};
