/**
 * @file queuePrintTicketTexts.ts
 * @description Centralized text constants for `QueuePrintContent` printed ticket display.
 *
 * Defines all user-facing strings including ticket type badges, queue labels,
 * metadata prefixes, default locations, and bilingual patient reminder copy.
 */

/**
 * Text dictionary for on-screen kiosk ticket representation and printer output.
 */
export const QueuePrintTicketTexts = {
    /** Document type badge printed at the top of the ticket. */
    ticketType: "QUEUE TICKET",
    /** English primary queue callout label. */
    queueLabel: "Your Queue Number",
    /** Filipino secondary queue callout label. */
    queueLabelFil: "Ang Inyong Numero sa Pila",
    /** Date prefix label. */
    datePrefix: "Date:",
    /** Time prefix label. */
    timePrefix: "Time:",
    /** Destination cubicle prefix label. */
    cubiclePrefix: "Cubicle:",
    /** Destination location prefix label (backwards-compatible alias for cubiclePrefix). */
    locationPrefix: "Cubicle:",
    /** Default destination when no cubicle has been assigned yet. */
    defaultLocation: "Waiting Area",
    /** Default fallback service label. */
    defaultService: "Consultation",
    /** Filipino patient waiting reminder notice. */
    reminderFil: "Mangyaring maghintay na tawagin ang inyong numero sa Rehistrasyon.",
    /** English patient waiting reminder notice. */
    reminderEn: "Please wait for your number to be called at Registration.",
    /** Timezone indicator suffix for Philippine Standard Time. */
    manilaTzSuffix: "PHT",
    /** Primary English section header for estimated wait time. */
    ewtLabel: "Estimated Wait Time",
    /** Secondary Filipino section header for estimated wait time. */
    ewtLabelFil: "Tinatayang Oras ng Paghihintay",
    /** English disclaimer note below estimated wait time callout. */
    ewtDisclaimer: "* Wait time is an estimate and may vary depending on clinic volume.",
    /** Filipino disclaimer note below estimated wait time callout. */
    ewtDisclaimerFil: "* Pagtatantya lamang ito at maaaring magbago depende sa dami ng pasyente.",
} as const;

