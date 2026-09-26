/**
 * @file smsModalTexts.ts
 * @description Centralized text constants for the SMS confirmation and skip warning modals.
 */

export const SMSModalTexts = {
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
