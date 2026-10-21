/**
 * @file smsInstructionTexts.ts
 * @description Centralized text constants for the SMS input instruction banner.
 */

export const SMSInstructionTexts = {
    titleFil: "Ilagay ang Mobile Number",
    titleEn: "Enter Mobile Number",
    subtitleFil: "Pakilagay ang inyong numero ng telepono para sa SMS updates",
    subtitleEn: "Please enter your mobile phone number for queue updates",
    hintFil: "Makatatanggap po kayo ng libreng SMS notification kapag malapit na ang inyong numero sa pila.",
    hintEn: "You will receive a free SMS notification when your queue number is called.",
    instructionFil: "Pakilagay ang inyong numero ng telepono sa format na ito:",
    instructionEn: "Please enter your phone number in this format:",
    printerOfflineTitleFil: "Paalala: Digital at SMS Ticket Lamang",
    printerOfflineTitleEn: "Notice: On-Screen & SMS Ticket Only",
    printerOfflineNoticeFil: "Kasalukuyang walang pisikal na print. Makakatanggap po kayo ng digital ticket sa screen at libreng SMS notification kapag malapit na ang inyong numero sa pila.",
    printerOfflineNoticeEn: "Physical printing unavailable. You will receive an on-screen ticket and free SMS notification when your queue number is called.",
} as const;
