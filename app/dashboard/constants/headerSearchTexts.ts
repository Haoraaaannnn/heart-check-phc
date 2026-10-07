/**
 * @fileoverview Centralized UI text and accessibility strings for the Admin Dashboard Header Search.
 *
 * Implements strict separation of concerns in compliance with AGENTS.md:
 * zero hardcoded UI strings, zero emojis, professional clinical copy.
 *
 * @module app/dashboard/constants/headerSearchTexts
 */

/**
 * Text copy dictionary for the header search bar and interactive results dropdown.
 */
export const HEADER_SEARCH_TEXTS = {
  /** Input field placeholders, labels, and keyboard hints */
  input: {
    placeholder: 'Search patient, ticket number, or service...',
    mobilePlaceholder: 'Search tickets, patients, or pages...',
    ariaLabel: 'Search patient, ticket number, or service across the workspace',
    shortcut: 'Ctrl + K',
    clearButtonAria: 'Clear search query',
  },

  /** Result category headings displayed in the dropdown */
  categories: {
    quickNavigation: 'Quick Navigation',
    patientsAndTickets: 'Patients & Tickets',
    clinicalServices: 'Clinical Services',
  },

  /** Data badges and item labels */
  items: {
    ticketPrefix: 'Ticket',
    patientIdPrefix: 'ID #',
    waitTimeSuffix: 'wait',
    phonePrefix: 'Phone:',
    registeredPrefix: 'Registered',
    noPhone: 'No contact number',
  },

  /** Empty search state copy */
  emptyState: {
    title: 'No matching records found',
    description: (query: string) =>
      `No patient tickets, clinical services, or dashboard pages matching "${query}".`,
    actionButton: 'Search all in Patient Records',
  },

  /** Keyboard shortcut hints in the dropdown footer */
  footer: {
    pressEnterHint: 'Press Enter to search all records in Patient Records',
    navigateHint: 'Navigate',
    selectHint: 'Select',
    closeHint: 'Close',
  },

  /** Responsive mobile drawer / overlay copy */
  mobile: {
    openSearchAria: 'Open search dialog',
    closeSearchAria: 'Close search dialog',
    backButtonAria: 'Close search overlay',
    headerTitle: 'Search Workspace',
  },
} as const;

export default HEADER_SEARCH_TEXTS;
