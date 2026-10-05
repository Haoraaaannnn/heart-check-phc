"use client";

/**
 * @file page.tsx
 * @description Unauthorized access error page for Heart Check PHC.
 *
 * This page is displayed when the Next.js Edge Middleware (`middleware.ts`)
 * detects that an authenticated user's role does not satisfy the access
 * requirements of the requested protected route.
 *
 * This is Layer 1 of the two-layer security architecture's redirect target.
 * It is NOT shown for unauthenticated users — those are redirected to `/login`.
 * This page is specifically for authenticated users who lack the required role.
 *
 * @remarks
 * Example scenarios:
 * - A `nurse` user navigating to `/superadmin` or `/dashboard`.
 * - An `admin` user navigating to `/superadmin`.
 *
 * The page provides a clear error message and a direct link back to `/login`
 * so the user can sign in with an authorized account.
 *
 * @see middleware.ts
 * @see docs/specifications/SECURITY.md
 * @module app/unauthorized
 */

import Link from "next/link";

/**
 * UnauthorizedPage component.
 *
 * Renders a full-viewport error screen informing the user that they do not
 * have sufficient permissions to access the requested route.
 *
 * @returns A full-screen access denied UI with a login redirect link.
 */
export default function UnauthorizedPage() {
    return (
        <>
            <title>Access Denied - Heart Check PHC</title>
            <meta
                name="description"
                content="You do not have permission to access this page."
            />
            <main
                style={{
                    minHeight: "100dvh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 60%, #fecdd3 100%)",
                    padding: "2rem",
                    fontFamily: "var(--font-sans, system-ui, sans-serif)",
                }}
            >
                <section
                    style={{
                        maxWidth: "480px",
                        width: "100%",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "1.5rem",
                    }}
                    aria-labelledby="unauthorized-heading"
                >
                    {/* Icon */}
                    <span
                        aria-hidden="true"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #9f1239 0%, #e11d48 100%)",
                            boxShadow: "0 8px 32px rgba(225, 29, 72, 0.30)",
                        }}
                    >
                        <i
                            className="bx bx-lock-alt"
                            style={{ fontSize: "2.5rem", color: "#fff" }}
                        />
                    </span>

                    {/* Heading */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <h1
                            id="unauthorized-heading"
                            style={{
                                margin: 0,
                                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                                fontWeight: 700,
                                color: "#9f1239",
                                lineHeight: 1.2,
                            }}
                        >
                            Access Denied
                        </h1>
                        <p
                            style={{
                                margin: 0,
                                fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
                                color: "#6b7280",
                                lineHeight: 1.6,
                            }}
                        >
                            Your account does not have permission to access this page.
                            Please sign in with an authorized account.
                        </p>
                    </div>

                    {/* Divider */}
                    <hr
                        style={{
                            width: "100%",
                            border: "none",
                            borderTop: "1px solid rgba(244, 205, 208, 0.8)",
                        }}
                    />

                    {/* Action */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
                        <Link
                            href="/login"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                                padding: "0.75rem 2rem",
                                borderRadius: "0.75rem",
                                background: "linear-gradient(135deg, #9f1239 0%, #e11d48 100%)",
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: "0.95rem",
                                textDecoration: "none",
                                boxShadow: "0 4px 16px rgba(225, 29, 72, 0.25)",
                                transition: "opacity 0.15s ease",
                            }}
                            id="unauthorized-back-to-login"
                        >
                            <i className="bx bx-log-in" style={{ fontSize: "1.1rem" }} />
                            Back to Login
                        </Link>

                        <p
                            style={{
                                margin: 0,
                                fontSize: "0.8rem",
                                color: "#9ca3af",
                            }}
                        >
                            If you believe this is a mistake, contact your system administrator.
                        </p>
                    </div>
                </section>
            </main>
        </>
    );
}
