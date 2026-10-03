/**
 * @fileoverview Re-export proxy for SettingsPanel to maintain backward compatibility.
 *
 * Preserves legacy imports referencing the typographical variant 'SettingsPannel.tsx'.
 * New code should import directly from './SettingsPanel'.
 *
 * @module app/superadmin/components/SettingsPannel
 */

export { SettingsPanel } from './SettingsPanel';