/**
 * @file kioskBannerTexts.ts
 * @description Centralized single source of truth for banner titles and subtitles across all kiosk screens.
 *
 * @remarks
 * Every screen banner text file (patientType, services, category, cubicle, SMS, queuePrint)
 * links to this file so changes to the hospital welcome title or screen instructions are centralized.
 *
 * Conforms to AGENTS.md:
 * - Strictly zero emojis in code, comments, and strings.
 * - Centralized under app/kiosk/constants/kioskBannerTexts.ts.
 */

/** Universal hospital welcome greeting used as the default bannerTitle across kiosk screens. */
export const KIOSK_DEFAULT_BANNER_TITLE = "Magandang Araw! Welcome to Heart Check PHC!";

export const sharedKioskBannerTexts = {
    /** Universal hospital welcome greeting used as the default bannerTitle across kiosk screens. */
    defaultGreeting: KIOSK_DEFAULT_BANNER_TITLE,

    patientType: {
        bannerTitle: KIOSK_DEFAULT_BANNER_TITLE,
        bannerSubtitle: "Pumili at pindutin ang kategoryang naayon sa inyo",
        title: KIOSK_DEFAULT_BANNER_TITLE,
        subtitle: "Pumili at pindutin ang kategoryang naayon sa inyo",
    },
    services: {
        bannerTitle: KIOSK_DEFAULT_BANNER_TITLE,
        bannerSubtitle: "Pumili at pindutin ang serbisyong kailangan ninyo:",
        title: KIOSK_DEFAULT_BANNER_TITLE,
        subtitle: "Pumili at pindutin ang serbisyong kailangan ninyo:",
    },
    category: {
        bannerTitle: "Piliin ang naaayon sa iyong edad:",
        bannerSubtitle: "Select based on your age:",
        titleFil: "Piliin ang naaayon sa iyong edad:",
        titleEn: "Select based on your age:",
        title: "Piliin ang naaayon sa iyong edad:",
        subtitle: "Select based on your age:",
    },
    cubicle: {
        bannerTitle: KIOSK_DEFAULT_BANNER_TITLE,
        bannerSubtitle: "Pumili at pindutin ang pangalan ng inyong doktor:",
        headerTitle: KIOSK_DEFAULT_BANNER_TITLE,
        headerSubtitle: "Pumili at pindutin ang pangalan ng inyong doktor:",
        title: KIOSK_DEFAULT_BANNER_TITLE,
        subtitle: "Pumili at pindutin ang pangalan ng inyong doktor:",
    },
    sms: {
        bannerTitle: "Ilagay ang Mobile Number",
        bannerSubtitle: "Enter Mobile Number",
        titleFil: "Ilagay ang Mobile Number",
        titleEn: "Enter Mobile Number",
        title: "Ilagay ang Mobile Number",
        subtitle: "Enter Mobile Number",
    },
    queuePrint: {
        bannerTitle: "Maraming Salamat po!",
        bannerSubtitle: "Thank you!",
        headerFil: "Maraming Salamat po!",
        headerEn: "Thank you!",
        title: "Maraming Salamat po!",
        subtitle: "Thank you!",
    },
} as const;
