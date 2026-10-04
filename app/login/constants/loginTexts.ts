/**
 * @fileoverview Text dictionary and content definitions for the Staff Login module.
 *
 * Provides all enterprise copy, form labels, placeholder text, validation errors,
 * security disclaimers, and brute-force lockout countdown templates.
 *
 * @remarks
 * Strictly conforms to AGENTS.md: zero hardcoded strings in UI components,
 * zero emojis, professional clinical terminology, and no truncated labels.
 *
 * @module app/login/constants/loginTexts
 */

export const LOGIN_TEXTS = {
  /** Top navigation row texts */
  header: {
    backToHome: 'Back to Home',
    brandName: 'Heart Check',
    brandTag: 'PHC',
    subBrand: 'Staff Portal',
    toggleThemeLight: 'Switch to light mode',
    toggleThemeDark: 'Switch to dark mode',
  },

  /** Card heading and description */
  card: {
    badge: 'PHC',
    title: 'Staff Authentication',
    subtitle: 'Enter your clinical credentials to access Heart Check PHC workstations',
  },

  /** Form labels, placeholders, and action triggers */
  form: {
    emailLabel: 'Hospital Email Address',
    emailPlaceholder: 'staff.name@phc.gov.ph',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your secure password',
    showPasswordAria: 'Show password',
    hidePasswordAria: 'Hide password',
    forgotPasswordLink: 'Forgot password?',
    submitButton: 'Sign In to Workstation',
    submittingButton: 'Verifying Credentials',
  },

  /** Dynamic alerts, session notices, and lockout messaging */
  alerts: {
    idleLogout: 'Your session expired due to inactivity. Please sign in again.',
    invalidCredentials: 'The email or password provided is incorrect.',
    sessionEstablishmentFailed: 'Failed to establish security session. Please try again.',
    userRoleNotFound: 'User account active but no workstation role assigned.',
    genericError: 'A network or system error occurred during authentication.',
    lockoutTemplate: (mins: number, secs: number) =>
      `Too many failed attempts. Account temporarily locked for security. Try again in ${mins}m ${secs}s.`,
  },

  /** Security and regulatory footer disclaimers */
  footer: {
    securityNotice:
      'Authorized access only. All authentication attempts and operational sessions are logged in compliance with Philippine RA 10173 and PHC clinical security policies.',
    helpDesk: 'Need assistance? Contact OPD Systems IT Help Desk.',
  },
} as const;
