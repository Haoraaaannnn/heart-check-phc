/**
 * @fileoverview Text copy dictionary for the Patient Transfer workstation.
 *
 * All UI labels, button texts, tooltips, empty-state descriptions, modal messages,
 * and dialog strings used across the Patient Transfer module are centralized here
 * in accordance with AGENTS.md separation-of-concerns standard.
 *
 * @remarks
 * Strictly zero emojis. Universal text keys usable across workstations.
 *
 * @module constants/texts/transferTexts
 */

export const transferTexts = {
  // Navigation & Headers
  dashboardTitle: 'Patient Transfer',
  logoutLabel: 'Logout',
  collapseSidebar: 'Collapse to icons',
  expandSidebar: 'Expand with text',
  hideSidebar: 'Collapse to icons',
  openSidebar: 'Expand with text',
  servicesCrumb: 'Services',
  roomCrumbPrefix: 'Room',
  selectScreenLabel: 'Select Screen',
  selectScreenAria: 'Return to Select Screen',
  themeToggleLight: 'Switch to light mode',
  themeToggleDark: 'Switch to dark mode',

  // Queue Panel & On Progress Section
  queueTabTitle: 'Active Queue',
  idleTabTitle: 'Idle Patients',
  onProgressHeading: 'On Progress Queue',
  dragToCubiclesHint: '(Drag to cubicles)',
  autoAssigningHint: '(Auto-assigning)',
  noPatientsInQueue: 'No patients waiting in queue',
  lockedInStack: 'Locked in stack — waits for turn',
  servingNext: 'Serving Next',
  callPatientTooltip: 'Call patient number',
  assignNowTooltip: 'Assign to available cubicle now',
  moveToQueueTooltip: 'Return patient back to queue',
  queuePositionPrefix: '#',

  // Idle Numbers Section
  idleNumbersHeading: 'Idle Numbers',
  idleSubtitle: '(Timed out 5+ times)',
  noIdleNumbers: 'No idle numbers currently recorded.',
  activateIdleTooltip: 'Restore patient to active queue',
  removeIdleTooltip: 'Remove patient from queue',
  rotationCountPrefix: 'x',

  // Registration Counters
  registrationHeading: 'Registration Counters',
  counterPrefix: 'Counter',
  dragCounterHint: '(Drag to reassign counter)',
  noCountersAssigned: 'No counters assigned to your account.',
  noPatientsAtCounter: '— No patients waiting —',
  sendToQueueBtn: 'Send to Queue →',
  servingAtCounter: 'Now at Counter',

  // Cubicles & Lanes
  cubiclesHeading: 'Consultation & Screening Cubicles',
  dropPatientHere: 'Drop patient here to assign',
  cubicleFullAlert: 'Full (Capacity reached)',
  cubicleAvailable: 'Available',
  unassignedDoctor: 'Unassigned Doctor',
  doctorPrefix: 'Dr.',

  // Step Pickers & Permissions
  selectSubcategoryTitle: 'Select Patient Group',
  selectRoomTitle: 'Select Consultation Room',
  noRoomsConfiguredTitle: 'No rooms configured for this service',
  noRoomsConfiguredDesc: 'Please configure cubicles and rooms in the administrative settings.',
  noAccountRoomsTitle: 'No rooms assigned to your account',
  noAccountRoomsDesc: 'Ask a Super Admin to assign rooms or counters before managing patients here.',
  inQueueSuffix: 'in queue',
  atCounterSuffix: 'at counter',
  idleSuffix: 'idle',
  assignedSuffix: 'assigned',
  roomPrefix: 'Room',

  // Drag & Drop Feedback
  dropTargetInvalid: 'Cannot drop patient here',
  dropTargetFull: 'Cubicle is at maximum capacity',
  dropTargetSame: 'Patient is already at this cubicle',
  draggingLabel: 'Moving Patient',

  // Click-to-Select & Tablet Interaction Mode
  selectedPatientBannerPrefix: 'Selected:',
  selectedQueuePatientHint: 'Tap an available cubicle to assign',
  selectedCubiclePatientHint: 'Tap another cubicle to reassign',
  selectedCounterPatientHint: 'Tap target counter to move patient',
  cancelSelection: 'Cancel Selection',
  assignHereBtn: 'Assign Here',
  reassignHereBtn: 'Move Here',
  moveToCounterBtn: 'Move Here',
  tapToSelectHint: 'Tap to select or drag',
  tapToAssignHint: 'Tap to assign',
  selectedBadge: 'Selected',
  cubicleSelectTargetHint: 'Tap to assign patient here',
  counterSelectTargetHint: 'Tap to move patient here',
  cubicleFullNotice: 'Cubicle full (max 5)',
  deselectedNotice: 'Selection cancelled',

  // Station View Switcher (Tablet & Layout Controls)
  viewToggleCubicles: 'Cubicles',
  viewToggleCounters: 'Registration Counters',
  viewToggleBoth: 'Split View',
  stationsSectionTitle: 'Service Stations',

  // Action Buttons & Labels (Icon-Free Typography)
  activateBtn: 'Activate',
  removeBtn: 'Remove',
  doctorsBtn: 'Doctors',
  closeBtn: 'Close',
  callBtn: 'Call',
  callingBtn: 'Calling...',
  backBtn: 'Back',
  assignBtn: 'Assign',
  show: 'Show',
  hide: 'Hide',
  noServiceSelectedTitle: 'No Service Selected',
  noServiceSelectedDesc: 'Select a service from the sidebar navigation to view and manage patient queues.',
  allCaughtUp: 'All caught up — nobody waiting.',
  brandLogoText: 'PHC',
  deactivateBtn: 'Deactivate',
  editBtn: 'Edit',
  deleteBtn: 'Delete',
  editingDoctorNotice: "Editing this doctor's cubicles below",

  // Confirm Assignment Modal Copy
  confirmAssignmentModalTitle: 'Confirm Assignment',
  confirmAssignmentsModalTitle: 'Confirm Assignments',
  confirmAssignmentModalDesc:
    'Review and confirm patient station assignments before updating live queues and dispatching notifications.',
  confirmAssignmentBtn: 'Confirm Assignment',
  confirmAssignmentsBtn: 'Confirm Assignments',
  cancelAssignmentBtn: 'Cancel',
  savingAssignment: 'Saving...',
  assignedToLabel: 'Assigned To',
  patientNumberLabel: 'Patient',
  smsNotificationNotice: 'SMS notification will be sent upon confirmation',

  // Quick-Assign Dropdown Copy
  quickAssignTitle: 'Assign to Station',
  quickAssignSubtitle: 'Select a cubicle to assign this patient',
  managePatientTitle: 'Patient Options',
  managePatientSubtitle: 'Choose an action for this patient',
  noCubiclesConfigured: 'No stations available for this service.',
  moveToQueueBtn: 'Move Back to Queue',
  moveToQueueSubtitle: 'Return patient to the waiting list',
  moveToOtherCubicleHeading: 'Or transfer to another cubicle:',
  callPatientAudioBtn: 'Call Patient',
  callPatientAudioSubtitle: 'Broadcast number on speaker',
  occupancyLabel: (current: number, max: number) => `${current}/${max} Patients`,
  occupancyFull: 'Station Full',
  badgeAssign: 'Assign',
  assigningStation: 'Assigning...',
  movingToQueue: 'Moving...',
  badgeReturn: 'Return',
  badgeSpeaker: 'Speaker',
  dismissHint: 'Tap outside or press Esc to close',
  doctorUpdateFailedTitle: 'Doctor Update Failed',
  assignmentUpdateFailedTitle: 'Assignment Update Failed',
  errorModalDismiss: 'Dismiss',

  // Doctors Panel Management Copy
  doctorsHeading: 'Doctors',
  doctorsSubtitle: 'Add doctors, then pick one below to choose which cubicles they cover.',
  addDoctorBtn: '+ Add Doctor',
  addDoctorModalTitle: 'Add Doctor',
  editDoctorModalTitle: 'Edit Doctor',
  fullNameLabel: 'Full name',
  fullNamePlaceholder: 'e.g. Juan Dela Cruz',
  specialtyLabel: 'Specialty',
  specialtyPlaceholder: 'Optional, e.g. Cardiology',
  activeCheckboxLabel: 'Active — available for cubicle assignment',
  confirmDeleteTitle: 'Confirm Delete',
  cancelBtn: 'Cancel',
  createBtn: 'Create',
  updateBtn: 'Update',
  savingBtn: 'Saving...',
  doctorAddedSuccess: 'Doctor added.',
  doctorUpdatedSuccess: 'Doctor updated.',
  failedToDeleteError: 'Failed to delete.',
  somethingWentWrongError: 'Something went wrong.',
  noSpecialtySet: 'No specialty set',
  activeStatus: 'Active',
  inactiveStatus: 'Inactive',
  cubicleAssignedCount: (count: number) => `${count} cubicle${count === 1 ? '' : 's'} assigned`,
  cubiclesForDoctor: (name: string) => `Cubicles for ${name}`,
  cubicleAssignmentsTitle: 'Cubicle assignments',
  cubicleAssignmentsSubtitle: (selected: boolean) =>
    selected
      ? 'Tap a cubicle to assign it to them, or tap again to remove it.'
      : 'Select a doctor above to assign their cubicles.',
  doneBtn: 'Done',
  roomLabel: (room: string) => `Room ${room}`,
  assignedDoctorLabel: (name: string) => `Dr. ${name}`,
  unassignedCubicleLabel: 'Unassigned',
  assignedStatus: 'Assigned',
  deleteDoctorConfirmMessage: (name: string, cubicleCount: number) =>
    `Are you sure you want to delete ${name}? They will be unassigned from ${cubicleCount} cubicle${
      cubicleCount === 1 ? '' : 's'
    }. This cannot be undone.`,
  loadingDoctors: 'Loading doctors and stations...',
  addDoctorFirstNotice: 'Add a doctor to start assigning them to cubicles.',
} as const;

export default transferTexts;
