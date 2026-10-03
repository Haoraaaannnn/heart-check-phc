/**
 * @fileoverview Application-wide ThemeProvider using next-themes.
 *
 * Configures class-based dark/light mode switching, system theme synchronization,
 * and suppresses jarring color transitions during rapid theme flips.
 *
 * @module app/provider
 */

"use client";

import React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

interface ThemeProviderProps {
  /** Page tree wrapped by the theme context. */
  children: React.ReactNode;
}

/**
 * Root theme context provider wrapping the application.
 *
 * @param props - Component properties containing children.
 * @returns JSX element providing theme state.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}