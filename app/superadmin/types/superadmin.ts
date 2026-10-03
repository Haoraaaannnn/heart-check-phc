/**
 * @fileoverview Type definitions for the SuperAdmin module in Heart Check PHC.
 *
 * Defines contracts for user accounts, clinical cubicles, service assignments,
 * room and counter allocations, and form state objects.
 *
 * @module app/superadmin/types/superadmin
 */

/**
 * Represents a registered hospital user in the system.
 */
export interface SuperadminUser {
  /** Supabase Auth UUID linking the user record. */
  auth_id: string;
  /** Primary contact and login email address. */
  email: string;
  /** Display username or staff identifier. */
  username: string;
  /** Role string specifying permissions: 'superadmin', 'admin', 'doctor', 'nurse', or 'registration'. */
  role: string;
  /** ISO timestamp when the user was created. */
  created_at: string;
}

/**
 * Clinical role string literals.
 */
export type ClinicalRole = 'nurse' | 'staff' | 'doctor';

/**
 * Registration role string literals.
 */
export type RegistrationRole = 'registration';

/**
 * All allowed role types in the system.
 */
export type SuperadminRole = 'superadmin' | 'admin' | 'doctor' | 'nurse' | 'registration';

/**
 * Represents a hospital consultation or screening cubicle.
 */
export interface CubicleOption {
  /** Unique database identifier. */
  id: number;
  /** Cubicle alphanumeric code (e.g. 'Cubicle 1', 'C-02'). */
  cubicleNum: string;
  /** Department or service category (e.g. 'Consultation', 'OPD Screening'). */
  category: string;
  /** Physical hospital room number. */
  room: number;
  /** Optional clinical specialization or subcategory (e.g. 'Adult Cardiology'). */
  subcategory?: string | null;
}

/**
 * Room assignment structure for registration officers.
 */
export interface AssignedRoom {
  /** Parent service name (e.g. 'Consultation'). */
  service: string;
  /** Optional subcategory name (e.g. 'Pediatric Cardiology'). */
  subcategory: string | null;
  /** Physical room number. */
  room: number;
}

/**
 * Access options payload returned by the superadmin access API.
 */
export interface AccessOptions {
  /** List of all configured kiosk services. */
  services: string[];
  /** Subcategories for consultation routing. */
  consultationSubcategories: string[];
  /** Registered registration counter numbers (e.g. [1, 2, 3, 4, 5]). */
  counters: number[];
  /** Available rooms mapped to services and subcategories. */
  availableRooms: AssignedRoom[];
  /** Currently assigned services for the queried user. */
  assignedServices?: string[];
  /** Currently assigned rooms for the queried user. */
  assignedRooms?: AssignedRoom[];
  /** Currently assigned counter numbers for the queried user. */
  assignedCounters?: number[];
}

/**
 * Form state for creating or editing a user account.
 */
export interface UserFormData {
  /** Login email address. */
  email: string;
  /** Display username. */
  username: string;
  /** Password string (required on create, optional on edit). */
  password?: string;
  /** Selected user role. */
  role: SuperadminRole;
  /** Cubicle IDs assigned to clinical roles. */
  cubicleIds: number[];
  /** Services assigned to registration roles. */
  serviceAssignments: string[];
  /** Rooms assigned to registration roles. */
  roomAssignments: AssignedRoom[];
  /** Counter numbers assigned to registration roles. */
  counterAssignments: number[];
}

/**
 * Summary metrics for user accounts.
 */
export interface UserStats {
  /** Total count of all user accounts. */
  totalUsers: number;
  /** Count of clinical staff (nurses, doctors). */
  clinicalStaff: number;
  /** Count of front-desk registration staff. */
  registrationStaff: number;
  /** Count of administrative users (superadmin, admin). */
  adminUsers: number;
}
