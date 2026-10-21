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

    // On-Screen Fallback Tokens (Photo ticket fallback)
    /** Fallback header Filipino title. */
    fallbackTitleFil: "Kunan ng Litrato / I-save ang Inyong Ticket",
    /** Fallback header English title. */
    fallbackTitleEn: "Take a Photo / Save Your Ticket",
    /** Fallback reason when thermal paper roll is empty (Filipino). */
    reasonOutOfPaperFil: "Naubusan ng papel ang printer.",
    /** Fallback reason when thermal paper roll is empty (English). */
    reasonOutOfPaperEn: "Printer is out of paper.",
    /** Fallback reason when paper jam or cutter error occurs (Filipino). */
    reasonPaperJamFil: "May bara sa printer.",
    /** Fallback reason when paper jam or cutter error occurs (English). */
    reasonPaperJamEn: "Printer paper jam detected.",
    /** Fallback reason when printer cover is open (Filipino). */
    reasonCoverOpenFil: "Bukas ang takip ng printer.",
    /** Fallback reason when printer cover is open (English). */
    reasonCoverOpenEn: "Printer cover is open.",
    /** Fallback reason when printer is offline (Filipino). */
    reasonOfflineFil: "Offline o hindi nakakabit ang printer.",
    /** Fallback reason when printer is offline (English). */
    reasonOfflineEn: "Printer is offline or unreachable.",
    /** Fallback reason when no printer is configured or detected (Filipino). */
    reasonNotDetectedFil: "Walang nakakabit na physical printer.",
    /** Fallback reason when no printer is configured or detected (English). */
    reasonNotDetectedEn: "No physical printer detected.",

    /** Guidance instructing patient to photograph their ticket (Filipino). */
    photoInstructionFil: "Paki-kunan po ng litrato ang screen gamit ang inyong cellphone bago magtungo sa cubicle.",
    /** Guidance instructing patient to photograph their ticket (English). */
    photoInstructionEn: "Please take a photo of this screen with your smartphone before proceeding to your cubicle.",


    /** Primary button allowing patient to complete intake immediately (Filipino). */
    finishButtonFil: "Nai-save Ko Na / Tapusin",
    /** Primary button allowing patient to complete intake immediately (English). */
    finishButtonEn: "I've Saved My Ticket / Finish",
    /** Auto-close countdown notice text prefix. */
    autoClosePrefix: "Screen automatically returns to entrance in",
    /** Auto-close countdown notice text suffix. */
    autoCloseSuffix: "seconds",
    /** Auto-close countdown notice prefix (Filipino). */
    autoClosePrefixFil: "Kusang babalik sa simula sa loob ng",
    /** Auto-close countdown notice suffix (Filipino). */
    autoCloseSuffixFil: "segundo",
} as const;


