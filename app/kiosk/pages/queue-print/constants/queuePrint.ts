import { themeColors } from "@/constants/colors";

/** Number of milliseconds to display the ticket on screen before returning to entrance. */
export const QUEUE_PRINT_REDIRECT_DELAY_MS = 5000;

// Re-export text copy for backward compatibility
export { queuePrintTexts } from "./queuePrintTexts";

/** Theme styling for queue print elements. */
export const queuePrintTheme = {
    badgeBg: themeColors.brandRed,
};
