/**
 * @fileoverview Text copy dictionary for the Patient Transfer dashboard.
 *
 * All UI labels, button text, tooltips, empty-state descriptions, and modal messages
 * used across `app/transfer/` are centralized here in accordance with AGENTS.md.
 */

export const transferTexts = {
  // Navigation & Headers
  dashboardTitle: "Patient Transfer",
  logoutLabel: "Logout",
  collapseSidebar: "Collapse sidebar",
  expandSidebar: "Expand sidebar",
  servicesCrumb: "Services",
  roomCrumbPrefix: "Room",

  // Queue Panel & On Progress Section
  queueTabTitle: "Active Queue",
  idleTabTitle: "Idle Patients",
  onProgressHeading: "On Progress Queue",
  dragToCubiclesHint: "(Drag to cubicles)",
  autoAssigningHint: "(Auto-assigning)",
  noPatientsInQueue: "No patients waiting in queue",
  lockedInStack: "Locked in stack — waits for turn",
  servingNext: "Serving Next",
  callPatientTooltip: "Call patient number",
  assignNowTooltip: "Assign to available cubicle now",
  moveToQueueTooltip: "Return patient back to queue",
  queuePositionPrefix: "#",

  // Idle Numbers Section
  idleNumbersHeading: "Idle Numbers",
  idleSubtitle: "(Timed out 5+ times)",
  noIdleNumbers: "No idle numbers currently recorded.",
  activateIdleTooltip: "Restore patient to active queue",
  removeIdleTooltip: "Remove patient from queue",
  rotationCountPrefix: "x",

  // Registration Counters
  registrationHeading: "Registration Counters",
  counterPrefix: "Counter",
  dragCounterHint: "(Drag to reassign counter)",
  noCountersAssigned: "No counters assigned to your account.",
  noPatientsAtCounter: "— No patients waiting —",
  sendToQueueBtn: "Send to Queue →",
  servingAtCounter: "Now at Counter",

  // Cubicles & Lanes
  cubiclesHeading: "Consultation & Screening Cubicles",
  dropPatientHere: "Drop patient here to assign",
  cubicleFullAlert: "Full (Capacity reached)",
  cubicleAvailable: "Available",
  unassignedDoctor: "Unassigned Doctor",
  doctorPrefix: "Dr.",

  // Step Pickers & Permissions
  selectSubcategoryTitle: "Select Patient Group",
  selectRoomTitle: "Select Consultation Room",
  noRoomsConfiguredTitle: "No rooms configured for this service",
  noRoomsConfiguredDesc: "Please configure cubicles and rooms in the administrative settings.",
  noAccountRoomsTitle: "No rooms assigned to your account",
  noAccountRoomsDesc: "Ask a Super Admin to assign rooms or counters before managing patients here.",
  inQueueSuffix: "in queue",
  atCounterSuffix: "at counter",
  idleSuffix: "idle",
  assignedSuffix: "assigned",
  roomPrefix: "Room",

  // Drag & Drop Feedback
  dropTargetInvalid: "Cannot drop patient here",
  dropTargetFull: "Cubicle is at maximum capacity",
  dropTargetSame: "Patient is already at this cubicle",
  draggingLabel: "Moving Patient",
} as const;

export default transferTexts;
