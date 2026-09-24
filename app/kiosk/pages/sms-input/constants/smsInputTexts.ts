/**
 * Text copy for the SMS phone number input step and confirmation modals.
 *
 * Provides bilingual instructions, button labels (Continue, Cancel, Skip),
 * confirmation modal prompts, and skip-warning modal copy.
 */
export const smsInputTexts = {
    instructionFil: "Pakilagay ang inyong numero ng telepono sa format na ito:",
    instructionEn: "Please enter your phone number in this format:",
    continueBtn: "Magpatuloy - Continue",
    cancelBtn: "Bumalik - Cancel",
    skipBtn: "Laktawan - Skip",
    continueModalTitleFil: "Magpatuloy?",
    continueModalTitleEn: "Continue?",
    continueModalMsgFil: "Tama ba ang inyong numero?",
    continueModalMsgEn: "Is this your correct phone number?",
    continueModalConfirm: "Oo, Tama - Yes, Correct",
    continueModalCancel: "Hindi, Baguhin - No, Change",
    skipModalTitleFil: "Walang Notipikasyon",
    skipModalTitleEn: "No Notification",
    skipModalMsgFil: "Kung laktawan ninyo ang numero, hindi kayo makakatanggap ng SMS notipikasyon. Magpatuloy pa rin?",
    skipModalMsgEn: "If you skip the number, you will not receive SMS notifications. Continue anyway?",
    skipModalConfirm: "Oo, Magpatuloy - Yes, Continue",
    skipModalCancel: "Bumalik - Go Back",
} as const;
