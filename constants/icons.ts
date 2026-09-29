/**
 * @fileoverview Central icon configuration dictionary and resolver utilities using Boxicons.
 *
 * Provides a single source of truth for service category icons, patient type icons,
 * subcategory icons, and common UI action icons across Kiosk, Nurse, Transfer,
 * and Superadmin dashboards.
 *
 * @module constants/icons
 */

/**
 * Mapping of service category names to their respective Boxicons class names.
 * Standardized across Kiosk, Nurse Dashboard, and Transfer Dashboard.
 */
export const CATEGORY_ICONS: Record<string, string> = {
  'Consultation': 'bx-chat',
  'OPD Card': 'bx-id-card',
  'Refill Prescription': 'bx-capsule',
  'ECG': 'bx-heart',
  'Warfarin': 'bxs-capsule',
  'OPD Reschedule': 'bx-calendar',
  'Benzathine': 'bx-injection',
  'OPD Screening': 'bx-search-alt-2',
};

/**
 * Semantic alias for service category icons across application boundaries.
 */
export const SERVICE_CATEGORY_ICONS = CATEGORY_ICONS;

/**
 * Boxicons representing patient registration types (new vs returning).
 */
export const PATIENT_TYPE_ICONS: Record<string, string> = {
  new: 'bx-user-plus',
  old: 'bx-user-check',
  both: 'bx-user',
};

/**
 * Age group subcategory icons (used in Consultation and OPD Screening flows).
 */
export const SUBCATEGORY_ICONS: Record<string, string> = {
  Adult: 'bx-male',
  Pedia: 'bx-child',
};

/**
 * Shared action and navigation Boxicons used throughout the application.
 */
export const COMMON_ICONS = {
  back: 'bx-arrow-back',
  arrowRight: 'bx-right-arrow-alt',
  chevronRight: 'bx-chevron-right',
  chevronDown: 'bx-chevron-down',
  backspace: 'bx-arrow-back',
  download: 'bx-download',
  spinner: 'bx-loader-alt',
  stethoscope: 'bx-pulse',
  cubicle: 'bx-pulse',
  adult: 'bx-male',
  pedia: 'bx-child',
  check: 'bx-check',
  close: 'bx-x',
  fallback: 'bx-folder',
} as const;

/**
 * Centralized Boxicons for sidebar navigation across Nurse Station and Patient Transfer dashboards.
 */
export const SIDEBAR_ICONS = {
  brand: 'bx-heart',
  brandSolid: 'bxs-heart',
  allCubicles: 'bx-grid-alt',
  collapse: 'bx-chevron-left',
  expand: 'bx-chevron-right',
  logout: 'bx-log-out',
  fallbackCategory: 'bx-folder',
} as const;

/**
 * Semantic alias for sidebar navigation icons.
 */
export const NAVIGATION_ICONS = SIDEBAR_ICONS;

/**
 * Curated list of Boxicons available for service customization in Superadmin.
 */
export const AVAILABLE_SERVICE_BOXICONS: readonly string[] = [
  'bx-chat',
  'bx-id-card',
  'bx-capsule',
  'bx-heart',
  'bxs-capsule',
  'bx-calendar',
  'bx-injection',
  'bx-search-alt-2',
  'bx-pulse',
  'bx-plus-medical',
  'bx-first-aid',
  'bx-clinic',
  'bx-user',
  'bx-user-plus',
  'bx-user-check',
  'bx-folder',
  'bx-folder-open',
  'bx-time',
  'bx-time-five',
  'bx-file',
  'bx-notepad',
  'bx-clipboard',
  'bx-badge-check',
  'bx-check-shield',
  'bx-shield',
  'bx-band-aid',
  'bx-test-tube',
  'bx-vial',
] as const;

/**
 * Legacy Tabler Icon name mapping to equivalent Boxicons class names.
 * Ensures seamless backward compatibility with existing database rows where
 * `icon_src` contains a Tabler component name.
 */
export const LEGACY_TABLER_TO_BOXICON_MAP: Record<string, string> = {
  IconUser: 'bx-user',
  IconUserPlus: 'bx-user-plus',
  IconUserCheck: 'bx-user-check',
  IconMoodKid: 'bx-child',
  IconArrowNarrowRight: 'bx-right-arrow-alt',
  IconArrowLeft: 'bx-arrow-back',
  IconStethoscope: 'bx-pulse',
  IconHeartbeat: 'bx-heart',
  IconEcg: 'bx-heart',
  IconPill: 'bx-capsule',
  IconPills: 'bx-capsule',
  IconId: 'bx-id-card',
  IconClipboardList: 'bx-search-alt-2',
  IconCalendarClock: 'bx-calendar',
  IconVaccine: 'bx-injection',
  IconBackspace: 'bx-arrow-back',
  IconDownload: 'bx-download',
  IconLoader2: 'bx-loader-alt',
  IconCircleDashed: 'bx-folder',
};

/**
 * Resolves the Boxicons class name for a given service or icon identifier.
 *
 * @remarks
 * Handles multiple resolution strategies:
 * 1. Checks if `icon_src` is directly a Boxicons class (starts with 'bx-' or 'bxs-').
 * 2. Checks if `icon_src` is a legacy Tabler icon name and translates it.
 * 3. Resolves based on the service's `label_en` against {@link CATEGORY_ICONS}.
 * 4. Falls back to a safe default icon (`bx-folder`).
 *
 * @param service - A service object with `label_en` and `icon_src`, or a string icon/service name.
 * @returns A valid Boxicons class name (e.g. 'bx-heart').
 */
export function resolveServiceIcon(
  service?: { label_en?: string; icon_src?: string } | string | null
): string {
  if (!service) return COMMON_ICONS.fallback;

  // Handle string parameter directly
  if (typeof service === 'string') {
    const trimmed = service.trim();
    if (trimmed.startsWith('bx-') || trimmed.startsWith('bxs-')) {
      return trimmed;
    }
    if (CATEGORY_ICONS[trimmed]) {
      return CATEGORY_ICONS[trimmed];
    }
    if (LEGACY_TABLER_TO_BOXICON_MAP[trimmed]) {
      return LEGACY_TABLER_TO_BOXICON_MAP[trimmed];
    }
    return COMMON_ICONS.fallback;
  }

  // Check explicit icon_src on service record
  const iconSrc = service.icon_src?.trim();
  if (iconSrc) {
    if (iconSrc.startsWith('bx-') || iconSrc.startsWith('bxs-')) {
      return iconSrc;
    }
    if (LEGACY_TABLER_TO_BOXICON_MAP[iconSrc]) {
      return LEGACY_TABLER_TO_BOXICON_MAP[iconSrc];
    }
  }

  // Resolve by canonical English label
  const labelEn = service.label_en?.trim();
  if (labelEn && CATEGORY_ICONS[labelEn]) {
    return CATEGORY_ICONS[labelEn];
  }

  return COMMON_ICONS.fallback;
}

/**
 * Resolves the Boxicons class name for a patient category (New or Old Patient).
 *
 * @param category - A patient category object or type string ('new' | 'old').
 * @returns A valid Boxicons class name (e.g. 'bx-user-plus').
 */
export function resolvePatientTypeIcon(
  category?: { type?: string; icon_src?: string } | string | null
): string {
  if (!category) return PATIENT_TYPE_ICONS.new;

  if (typeof category === 'string') {
    return PATIENT_TYPE_ICONS[category.toLowerCase()] ?? PATIENT_TYPE_ICONS.new;
  }

  const iconSrc = category.icon_src?.trim();
  if (iconSrc) {
    if (iconSrc.startsWith('bx-') || iconSrc.startsWith('bxs-')) {
      return iconSrc;
    }
    if (LEGACY_TABLER_TO_BOXICON_MAP[iconSrc]) {
      return LEGACY_TABLER_TO_BOXICON_MAP[iconSrc];
    }
  }

  const type = category.type?.toLowerCase();
  if (type && PATIENT_TYPE_ICONS[type]) {
    return PATIENT_TYPE_ICONS[type];
  }

  return PATIENT_TYPE_ICONS.new;
}
