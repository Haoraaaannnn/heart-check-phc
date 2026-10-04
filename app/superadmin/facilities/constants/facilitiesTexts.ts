/**
 * @fileoverview Text copy dictionary for the Facilities module in SuperAdmin.
 *
 * Centralizes all titles, labels, button texts, modal copy, and feedback notifications
 * for managing consultation rooms, cubicles, and physical registration counters.
 *
 * @module app/superadmin/facilities/constants/facilitiesTexts
 */

export const FACILITIES_TEXTS = {
  header: {
    pageTitle: 'Hospital Facilities & Stations',
    pageDescription: 'Manage clinical consultation rooms, screening cubicles, and physical registration counter desks.',
    tabRooms: 'Rooms & Cubicles',
    tabCounters: 'Registration Counters',
  },
  stats: {
    totalRooms: 'Registered Rooms',
    totalRoomsDesc: 'Active consultation & screening rooms',
    totalCubicles: 'Total Cubicles',
    totalCubiclesDesc: 'Individual patient assessment cubicles',
    activeCounters: 'Active Counters',
    activeCountersDesc: 'Operational front-desk intake stations',
  },
  rooms: {
    addRoomButton: 'Add New Room',
    addCubicleButton: 'Add Cubicle',
    renameRoomButton: 'Rename',
    deleteRoomButton: 'Delete Room',
    loadingText: 'Loading consultation rooms and cubicles...',
    emptyState: 'No consultation rooms configured yet.',
    modalAddTitle: 'Add New Consultation Room',
    modalRenameTitle: 'Rename Consultation Room',
    modalAddCubicleTitle: 'Add Cubicle to Room',
    modalEditCubicleTitle: 'Edit Cubicle Name',
    categoryLabel: 'Service / Department Category',
    subcategoryLabel: 'Clinical Subcategory (Specialization)',
    roomNumberLabel: 'Physical Room Number',
    cubicleCountLabel: 'Initial Number of Cubicles',
    cubicleNameLabel: 'Cubicle Name / Identifier',
    cubicleNamePlaceholder: 'e.g. Cubicle 1 or leave blank for auto-generation',
    saveButton: 'Save Room',
    updateButton: 'Update',
    cancelButton: 'Cancel',
    savingButton: 'Saving...',
  },
  counters: {
    addCounterTitle: 'Add New Counter Station',
    counterNumberLabel: 'Counter Number',
    counterNumberPlaceholder: 'Auto',
    counterLabelPlaceholder: 'Station Label (e.g. Senior Priority)',
    addCounterButton: 'Add Counter',
    loadingText: 'Loading counter stations...',
    emptyState: 'No registration counters configured yet.',
    counterPrefix: 'Counter',
    inUseBadge: 'in use',
    activeStatus: 'Active',
    inactiveStatus: 'Inactive',
    deleteButton: 'Delete',
    deleteConfirm: 'Delete counter station? Staff currently assigned to it will lose this station assignment.',
  },
} as const;
