/**
 * @file ewtTexts.ts
 * @description Kiosk-facing Estimated Wait Time (EWT) range definitions, bilingual labels, and formatting utilities.
 *
 * Implements human-friendly wait time ranges specified in docs/specifications/ESTIMATED_WAIT_TIME.md
 * to eliminate false precision across kiosk screens, thermal receipt prints, and SMS notifications.
 *
 * Re-exports from root constants/ewtTexts as the single source of truth.
 *
 * @module app/kiosk/constants/ewtTexts
 */

export * from '@/constants/ewtTexts';
