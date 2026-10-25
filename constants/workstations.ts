/**
 * @fileoverview Universal workstation descriptors and role-to-workstation access definitions.
 *
 * Centralizes workstation identifiers, metadata descriptions, and default role permissions
 * across Edge proxy, screen selector, workstation route guards, and SuperAdmin user configuration.
 *
 * Adheres strictly to AGENTS.md:
 * - Strict TypeScript typing with zero unvalidated assertions
 * - Pure and deterministic helper functions
 * - Zero emojis in comments and UI descriptions
 *
 * @module constants/workstations
 */

/**
 * Universal workstation identifier union.
 */
export type WorkstationId = 'transfer' | 'nurse' | 'dashboard' | 'superadmin';

/**
 * Metadata descriptor for an operational hospital workstation.
 */
export interface WorkstationDefinition {
  /** Unique workstation identifier key. */
  id: WorkstationId;
  /** Primary human-readable title. */
  label: string;
  /** Functional description of operational responsibilities. */
  description: string;
  /** Boxicons icon class. */
  icon: string;
  /** Destination route path. */
  route: string;
  /** Staff roles granted access by default. */
  defaultRoles: string[];
}

/**
 * Master catalog of operational hospital workstations.
 */
export const WORKSTATION_CATALOG: readonly WorkstationDefinition[] = [
  {
    id: 'transfer',
    label: 'Transfer Workstation',
    description: 'Patient routing, front-desk registration counters & queue management.',
    icon: 'bx-transfer-alt',
    route: '/transfer',
    defaultRoles: ['registration', 'nurse', 'staff', 'admin', 'superadmin'],
  },
  {
    id: 'nurse',
    label: 'Nurse Station',
    description: 'Clinical queue management, vitals triage & physician cubicle consultation.',
    icon: 'bx-plus-medical',
    route: '/nurse',
    defaultRoles: ['nurse', 'staff', 'doctor', 'admin', 'superadmin'],
  },
  {
    id: 'dashboard',
    label: 'Analytics Dashboard',
    description: 'Managerial metrics, operational flow graphs, patient logs & reporting.',
    icon: 'bx-bar-chart-alt-2',
    route: '/dashboard',
    defaultRoles: ['admin', 'superadmin'],
  },
  {
    id: 'superadmin',
    label: 'Superadmin Console',
    description: 'Hospital facility setup, account governance & system-wide administration.',
    icon: 'bx-shield-quarter',
    route: '/superadmin',
    defaultRoles: ['superadmin'],
  },
] as const;

/**
 * Resolves standard default workstation permissions for a specified role.
 *
 * @param role - Normalized staff role string.
 * @returns Array of default permitted workstation IDs.
 */
export function getDefaultWorkstationsForRole(role: string): WorkstationId[] {
  const normalized = (role || '').toLowerCase().trim();

  switch (normalized) {
    case 'superadmin':
      return ['superadmin', 'dashboard', 'nurse', 'transfer'];
    case 'admin':
      return ['dashboard', 'nurse', 'transfer'];
    case 'nurse':
      return ['nurse', 'transfer'];
    case 'doctor':
      return ['nurse'];
    case 'registration':
      return ['transfer'];
    case 'staff':
      return ['nurse', 'transfer'];
    default:
      return [];
  }
}

/**
 * Checks whether an account is permitted to access a specific workstation.
 *
 * Prioritizes user-level overrides (`allowedWorkstations` from `auth.users.user_metadata`)
 * before falling back to the standard role defaults.
 *
 * @param workstation - Target workstation identifier to check.
 * @param userRole - Role string from users table.
 * @param allowedWorkstations - Optional user-level override list of allowed workstations.
 * @returns True if the user is authorized to open the workstation.
 */
export function isWorkstationAllowed(
  workstation: WorkstationId,
  userRole: string,
  allowedWorkstations?: string[] | null
): boolean {
  if (Array.isArray(allowedWorkstations)) {
    return allowedWorkstations.includes(workstation);
  }
  return getDefaultWorkstationsForRole(userRole).includes(workstation);
}
