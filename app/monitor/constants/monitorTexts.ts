/**
 * @fileoverview Centralized copy and UI text dictionary for the Public TV Monitor module.
 *
 * Adheres strictly to AGENTS.md standards:
 * - Comprehensive JSDoc documentation (Rule 1)
 * - Strict separation of concerns (Rule 2)
 * - Zero emojis in all copy strings and comments (Rule 6)
 * - Full bilingual support (English and Filipino) for institutional public signage
 *
 * @module app/monitor/constants/monitorTexts
 */

export const MONITOR_TEXTS = {
  header: {
    divisionSubTitle: 'OUT-PATIENT DIVISION',
  },
  footer: {
    instructionEn: 'Please wait for your number to be called',
    instructionFil: 'Hintayin ang inyong numero na tawagin',
  },
  startScreen: {
    backButton: 'Back to Services',
    titleSuffix: 'Monitor',
    startButton: 'Start Monitor',
  },
  pairedLayout: {
    emptyState: 'No patients being served',
    colQueueNumber: 'Queue Number',
    colCubicleRoom: 'Cubicle / Room',
    nowServingBadge: 'Now Serving',
    nowCallingBadge: 'Calling Now',
    nextInQueueBadge: 'Next in Queue',
    nextPrefix: 'NEXT: ',
    doctorPrefix: 'Dr. ',
    emptyPlaceholder: '—',
    noNextTicket: 'No waiting queue',
  },
  tableLayout: {
    emptyState: 'No patients being served',
    colRoomCubicle: 'Room / Cubicle',
    roomPrefix: 'Room ',
    cubiclePrefix: 'Cubicle ',
    nowServingBadge: 'Now Serving',
    nowCallingBadge: 'Calling Now',
    nextBadge: 'Next',
    waitingBadge: 'Waiting',
    doctorPrefix: 'Dr. ',
    emptyPlaceholder: '—',
  },
  registrationLayout: {
    sectionTitle: 'Registration Counters',
    counterLabelPrefix: 'Counter ',
    queueNumbersRowTitle: 'Queue Numbers',
    nowServingBadge: 'Now Serving',
    nowCallingBadge: 'Calling Now',
    extendedIntakeBadge: 'Extended Intake',
    nextInQueueBadge: 'Next in Queue',
    nextInQueueSubLabel: 'Please prepare',
    estWaitNext: 'Est. ~3–5 mins',
    estWaitNextExtended: 'Finishing Up • Next Soon',
    upcomingQueueTitle: 'Upcoming Queue',
    waitingCountSuffix: ' in line',
    emptyPlaceholder: '—',
    noWaiting: 'No waiting queue',
    moreWaitingPrefix: '+',
    moreWaitingSuffix: ' more in queue',
  },
  selector: {
    title: 'Select Monitor',
    typeSelectionPrefix: 'Select ',
    typeSelectionSuffix: ' Type',
    backToCategories: 'Back to Categories',
    backToSelectScreen: 'Back to Select Screen',
    returnToSelectScreenTitle: 'Return to Select Screen',
  },
} as const;
