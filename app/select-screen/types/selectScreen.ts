/**
 * @fileoverview Type definitions and data models for the Screen Display Selector module.
 *
 * Defines configuration contracts for public display modes and staff operational
 * workstations, as well as staff profile models resolved from Supabase auth.
 *
 * @module app/select-screen/types/selectScreen
 */

/**
 * Screen display categories separating public displays from operational workstations.
 */
export type ScreenCategory = 'display' | 'workstation';

/**
 * Configuration item representing an available screen display mode.
 */
export interface ScreenOption {
  /** Unique identifier for the screen mode. */
  id: string;
  /** Display title for the screen mode. */
  title: string;
  /** Explanatory description of what the screen runs. */
  description: string;
  /** Boxicons class for the visual icon. */
  icon: string;
  /** Target route to navigate when selected. */
  route: string;
  /** Category grouping (public display vs staff workstation). */
  category: ScreenCategory;
  /** Badge label displaying the terminal role or display context. */
  badge: string;
  /** Array of staff roles permitted to view and select this screen option. */
  allowedRoles: string[];
  /** Whether choosing this option signs out the staff session (e.g. Patient Kiosk). */
  requiresSignOut?: boolean;
  /** Secondary security or operational notice displayed on the card. */
  notice?: string;
  /** Call-to-action button text. */
  actionLabel: string;
}

/**
 * Authenticated staff member details resolved for display and access control.
 */
export interface CurrentStaffProfile {
  /** User auth UUID matching auth.users and users.auth_id. */
  authId: string;
  /** User email address. */
  email: string;
  /** Staff username or display name. */
  username: string;
  /** Assigned system role (e.g., 'superadmin', 'admin', 'nurse', 'registration', 'doctor', 'staff'). */
  role: string;
}
