/**
 * @fileoverview Text copy dictionary for the Queue Prefix Map configuration card.
 *
 * Centralizes all UI labels, descriptions, button copy, and feedback messages for
 * the QueuePrefixPanel component, which allows administrators to configure the
 * mapping from clinical service and subcategory to queue prefix digit and room number.
 *
 * @remarks
 * Follows AGENTS.md rule 2: all copy is exported from a dedicated Texts file and
 * must never be hardcoded inside the component itself.
 *
 * @module app/superadmin/constants/queuePrefixTexts
 */

/**
 * All user-visible text strings for the Queue Prefix Map settings card.
 */
export const QUEUE_PREFIX_TEXTS = {
  /** Card heading displayed in the settings grid. */
  title: 'Queue Prefix and Room Mapping',

  /**
   * Short explanatory paragraph below the card heading.
   * Describes the purpose of prefix digits or letters and their relationship to rooms.
   */
  description:
    'Assign a unique queue prefix (the first letter or number on the queue number, such as C, S, or 1) and physical room number to each clinical service. ' +
    'The prefix determines the ticket series issued at the kiosk (e.g. prefix C yields C001, prefix 1 yields 1001). ' +
    'Room numbers link the service to the corresponding RoomsPanel entry.',

  /** Column header for the service name column. */
  serviceHeader: 'Service',

  /** Column header for the prefix digit column. */
  prefixHeader: 'Prefix',

  /** Column header for the room number column. */
  roomHeader: 'Room',

  /** Label for the save action button when idle. */
  saveButton: 'Save Mapping',

  /** Label for the save action button while the network request is in flight. */
  savingButton: 'Saving...',

  /** Success notification shown after a successful save. */
  success: 'Queue prefix mapping saved successfully.',

  /**
   * Validation error shown when any prefix or room value is out of range or
   * contains an invalid value before submission.
   */
  errorInvalid:
    'All queue prefixes must be alphanumeric (letters or numbers) up to 6 characters, and room numbers must be positive numbers between 1 and 999.',


  /** Accessible loading indicator text shown during initial data fetch. */
  loadingText: 'Loading queue prefix mapping...',

  /**
   * Informational note rendered below the table explaining that defaults are
   * applied when no saved mapping is found in the database.
   */
  defaultNote:
    'Values shown are the active defaults. Changes take effect immediately after saving and apply to all new kiosk check-ins.',
} as const;
