/**
 * @fileoverview Text copy dictionary for Kiosk Customization in SuperAdmin.
 *
 * Centralizes all user-facing labels, table headers, form placeholders,
 * validation errors, and confirmation prompts for managing outpatient kiosk services.
 *
 * @module app/superadmin/customization/constants/customizationTexts
 */

export const CUSTOMIZATION_TEXTS = {
  header: {
    pageTitle: 'Kiosk Services & Touchscreen Menu',
    pageDescription: 'Configure outpatient services, bilingual Tagalog/English descriptions, Boxicons, and triage sequence order on patient kiosks.',
    addServiceButton: 'Add New Service',
  },
  form: {
    newTitle: 'Create Kiosk Service',
    editTitle: 'Edit Kiosk Service',
    labelEn: 'Service Name (English)',
    labelEnPlaceholder: 'e.g. Adult Cardiology Consultation',
    labelFil: 'Service Name (Filipino / Tagalog)',
    labelFilPlaceholder: 'e.g. Konsultasyon sa Adult Cardiology',
    descEn: 'Instructions / Description (English)',
    descEnPlaceholder: 'Brief explanation displayed on the kiosk card...',
    descFil: 'Instructions / Description (Filipino)',
    descFilPlaceholder: 'Maikling paliwanag na ipinapakita sa kiosk card...',
    patientType: 'Eligible Patient Cohort',
    patientTypeNew: 'New Patients Only',
    patientTypeOld: 'Returning Patients Only',
    patientTypeBoth: 'Both (New & Returning)',
    displayOrder: 'Kiosk Menu Display Order',
    iconLabel: 'Boxicon Icon Class',
    iconPlaceholder: 'Search Boxicon class name (e.g. bx-pulse, bx-heart)...',
    queueConfigTitle: 'Print Queue Number Configuration',
    queueConfigSubtitle: 'Configure the initial prefix and digit padding for printed kiosk tickets. The prefix is the first letter or number printed on the ticket.',
    queuePrefixLabel: 'Queue Ticket Prefix (First Letter or Number)',
    queuePrefixPlaceholder: 'e.g. C, S, 1, 4',
    queuePrefixHelp: 'The first letter or number on the queue number (e.g. "C" produces C001, "1" produces 1001, "S" produces S001).',
    queuePadLengthLabel: 'Queue Pad Length (Digit Padding)',
    queuePadLengthPlaceholder: '3',
    queuePadLengthHelp: 'Number of numeric digits padded with zeros (e.g. 3 digits yields 001, 4 digits yields 0001). Valid range: 1 to 6 digits.',
    previewLabel: 'Print Queue Ticket Preview',
    previewExplanation: 'Sample queue ticket issued at the kiosk using these settings:',
    saveButton: 'Save Service',
    cancelButton: 'Cancel',
    savingButton: 'Saving...',
  },
  table: {
    colIcon: 'Icon',
    colLabels: 'Bilingual Labels (EN / FIL)',
    colPatientType: 'Eligibility',
    colQueueTicket: 'Ticket Prefix / Format',
    colOrder: 'Order',
    colActions: 'Actions',
    editButton: 'Edit',
    deleteButton: 'Delete',
    emptyTitle: 'No kiosk services found',
    deleteConfirm: 'Are you sure you want to delete this service? This cannot be undone and will remove the service from all patient kiosks.',
    noPrefixFallback: 'Standard',
  },
  validation: {
    labelsRequired: 'English and Filipino labels are both required.',
    iconRequired: 'Please pick or enter a valid Boxicon class name (e.g. bx-pulse, bx-heart).',
    padLengthInvalid: 'Queue pad length must be a whole number between 1 and 6.',
    prefixInvalid: 'Queue prefix must be alphanumeric (letters or numbers) up to 6 characters.',
  },
} as const;

