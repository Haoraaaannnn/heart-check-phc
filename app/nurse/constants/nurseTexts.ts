/**
 * @fileoverview Centralized text copy dictionary for the Nurse Dashboard.
 *
 * Enforces AGENTS.md Rule 2 (Strict Separation of Concerns).
 * All UI labels, button copy, tooltips, dialogs, empty states, and TTS phrases are defined here.
 * Contains zero emojis in accordance with repository standards.
 */

export const nurseTexts = {
  // Navigation & Header
  dashboardTitle: "Nurse Station",
  patientManagement: "Patient Care Management",
  syncingBadge: "Syncing...",
  liveStatus: "Live",
  logoutLabel: "Logout",
  collapseSidebar: "Collapse sidebar",
  expandSidebar: "Expand sidebar",
  allMyCubicles: "All My Cubicles",
  myCoverage: "My Coverage",
  roomPrefix: "Room",
  cubiclePrefix: "Cubicle",
  doctorOnDuty: "Attending Physician:",
  noDoctorAssigned: "No Doctor Assigned",
  viewFinishedLedger: "View Finished Ledger",
  closeFinishedLedger: "Close Ledger",
  filteredByPrefix: "Filtered by:",
  clearFilter: "Clear filter",

  // Clinical Stage Headings
  stageAssignedHeading: "In Queue / Assigned",
  stageWithDoctorHeading: "With Doctor",
  stageCarryoutHeading: "Carryout & Post-Care",
  stageFinishedHeading: "Finished Today",

  // Stage Empty States
  emptyAssigned: "No patients waiting in queue",
  emptyWithDoctor: "No patients currently with doctor",
  emptyCarryout: "No patients for carryout",
  emptyFinished: "No finished patients recorded today",

  // Action Buttons
  btnCall: "Call",
  btnCalling: "Calling...",
  btnWithDoctor: "With Doctor",
  btnCarryout: "Carryout",
  btnDone: "Done",
  btnBack: "Back",
  btnViewFinished: "View Finished Ledger",
  btnCloseFinished: "Close Ledger",
  btnCancelSelection: "Cancel Selection",
  btnMoveHere: "Move Here",
  cancelSelection: "Cancel",

  // Tooltips & Hints
  dragCardHint: "Drag card to next clinical stage",
  tapToSelectHint: "Tap to select patient",
  selectedHintAssigned: "Tap 'With Doctor' column or button to begin consultation",
  selectedHintWithDoctor: "Tap 'Carryout' column to transfer to post-care",
  selectedHintCarryout: "Tap 'Done' column to finish patient session",

  // Click-to-Select Tablet Mode
  selectedPatientPrefix: "Selected:",
  tapStageToMove: "Tap a target stage to advance patient",

  // Finished Table Columns & Drawer
  tableQueueNo: "Queue No.",
  tableService: "Service",
  tableCubicle: "Cubicle",
  tableConsultEnd: "Consult Finished",
  tableCarryoutEnd: "Carryout Finished",
  tableTotalTime: "Total Duration",
  searchFinishedPlaceholder: "Search by queue number or service...",
  drawerSubtitle: "Completed outpatient consultations recorded today",

  // Unassigned Account State
  unassignedTitle: "No cubicles assigned",
  unassignedDesc: "Your account does not have any cubicles assigned yet. Ask a Super Admin to assign your room before managing patients.",

  // Loading States
  loadingDashboard: "Loading nurse dashboard...",
  pleaseWait: "Please wait",

  // TTS Announcements
  ttsCallPhrase: (letter: string, digits: string, cubicleNum: string) =>
    `Number ${letter} ${digits}, Number ${letter} ${digits}, please proceed to ${cubicleNum}`,

  // Toast & Error Messages
  errorUpdateFailed: "Unable to update patient status. Please check your network connection.",
  errorUnauthorizedCubicle: "You are not authorized to update patients in this cubicle.",
} as const;

export default nurseTexts;
