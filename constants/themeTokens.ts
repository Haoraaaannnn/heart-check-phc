/**
 * @fileoverview Re-export portal for global design and theme tokens.
 *
 * Centralizes access to design system tokens located in `constants/designs/themeTokens.ts`.
 * Preserves backward compatibility across the entire repository while enforcing the AGENTS.md
 * standard that global design and theme tokens reside in dedicated design constant files.
 *
 * @module constants/themeTokens
 */

export * from '@/constants/designs/themeTokens';
