/**
 * @fileoverview Text copy dictionary for System Settings & Security in SuperAdmin.
 *
 * Centralizes all descriptions, labels, button copy, and feedback notifications
 * for auto-rotation timeout, rotations before idle, login lockout, and password change.
 *
 * @module app/superadmin/constants/settingsTexts
 */

export const SETTINGS_TEXTS = {
  sectionTitle: 'System Automation & Security Parameters',
  sectionSubtitle: 'Manage runtime queue timeouts, patient rotation limits, and account authentication policies.',
  
  rotateTimeout: {
    title: 'Auto-Rotation Timeout',
    description: 'Duration in minutes a patient can remain on-progress or inside a consultation cubicle before automatically rotating back to the waiting queue. Applies across OPD Screening, Consultation, and Specialized clinics.',
    unitLabel: 'minutes',
    minStepHint: 'Step: 0.5 minutes (30s increments)',
    saveButton: 'Save Timeout',
    savingButton: 'Saving...',
    success: 'Auto-rotation timeout updated successfully.',
    errorInvalid: 'Enter a valid number of minutes greater than 0.',
  },

  maxRotations: {
    title: 'Rotations Before Idle',
    description: 'Maximum consecutive times an unserved or stalled ticket can time out and return to the waiting queue before being automatically marked as Idle/No-Show.',
    unitLabel: 'rotations',
    minStepHint: 'Whole numbers only (min: 1)',
    saveButton: 'Save Limit',
    savingButton: 'Saving...',
    success: 'Rotations limit updated successfully.',
    errorInvalid: 'Enter a valid whole number greater than 0.',
  },

  maxLoginAttempts: {
    title: 'Maximum Failed Login Attempts',
    description: 'Number of consecutive incorrect password attempts permitted before a staff account is temporarily locked out to prevent brute-force intrusion.',
    unitLabel: 'attempts',
    minStepHint: 'Whole numbers only (min: 1)',
    saveButton: 'Save Policy',
    savingButton: 'Saving...',
    success: 'Login attempts policy updated successfully.',
    errorInvalid: 'Enter a valid whole number greater than 0.',
  },

  lockoutDuration: {
    title: 'Account Lockout Duration',
    description: 'Time window in seconds an account remains disabled once the maximum failed login threshold is reached.',
    unitLabel: 'seconds',
    minStepHint: 'Whole numbers only (min: 1)',
    saveButton: 'Save Duration',
    savingButton: 'Saving...',
    success: 'Lockout duration updated successfully.',
    errorInvalid: 'Enter a valid whole number greater than 0.',
  },

  changePassword: {
    title: 'Change Administrator Password',
    description: 'Update your superadmin account credentials. For security, active sessions on other browser devices will be invalidated.',
    currentPasswordLabel: 'Current Password',
    currentPasswordPlaceholder: 'Enter your existing password',
    newPasswordLabel: 'New Password',
    newPasswordPlaceholder: 'Enter a strong new password (min 8 characters)',
    confirmPasswordLabel: 'Confirm New Password',
    confirmPasswordPlaceholder: 'Re-enter your new password',
    saveButton: 'Update Password',
    savingButton: 'Updating...',
    success: 'Administrator password updated successfully.',
    errorMinLength: 'New password must be at least 8 characters long.',
    errorMismatch: 'New passwords do not match.',
    errorGeneral: 'Unable to update password. Please verify your current password.',
  },

  feedback: {
    loading: 'Loading system parameters...',
    genericError: 'Failed to save setting. Please check server logs.',
  },
} as const;
