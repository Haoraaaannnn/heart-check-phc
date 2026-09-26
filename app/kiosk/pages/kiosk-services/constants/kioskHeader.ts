import { CSSProperties } from "react";
import { themeColors } from "@/constants/colors";

/**
 * Responsive spacing for the kiosk footer.
 */
export const kioskHeaderSpacing = {
    paddingX: "clamp(24px, 5vw, 70px)",
    paddingY: "clamp(18px, 2.5vh, 35px)",
    brandGap: "clamp(12px, 1.5vw, 24px)",
} as const;

/**
 * Footer typography.
 */
export const kioskHeaderFontSize = {
    brand: "clamp(20px, 2.4vw, 34px)",
    time: "clamp(20px, 2.4vw, 34px)",
    date: "clamp(12px, 1.4vw, 18px)",
} as const;

/**
 * Font weights.
 */
export const kioskHeaderFontWeight = {
    normal: 400,
    black: 700,
} as const;

/**
 * Clock line height.
 */
export const kioskHeaderTimeLineHeight = "1.2";

/**
 * Footer text colors — references the centralized palette.
 */
export const kioskHeaderTextColor = {
    white: themeColors.white,
} as const;

/**
 * Footer height.
 *
 * The larger height gives the waves enough vertical space
 * to reproduce the PHC-style flowing footer seen in the reference.
 */
// clamp(220px, 25vh, 480px) 
export const kioskHeaderMinHeight = "clamp(150px, 18vh, 380px)";

/**
 * ============================================================
 * PHC-STYLE MULTI-WAVE FOOTER
 * ============================================================
 *
 * IMPORTANT:
 *
 * These waves intentionally DO NOT share the same curve.
 *
 * Each layer has:
 * - a different starting height
 * - a different trough
 * - a different peak
 * - different control points
 *
 * This prevents the "stacked synchronized waves" appearance.
 *
 * The overall composition is inspired by the reference:
 *
 *       light red
 *    ~~~~~~~~~~~~~~~
 *       rose red
 *       ~~~~~~~~~~~~~
 *          bright red
 *       ~~~~~~~~~~~~~~~
 *    dark brand red
 *   ~~~~~~~~~~~~~~~~~~~
 *
 * The large dark-red layer also sweeps upward/downward
 * independently instead of simply following the layers above.
 */
export const kioskHeaderWaveLayers = [
    {
        /**
         * BACK / LIGHTEST WAVE
         *
         * Starts relatively high on the left,
         * falls deeply toward the center,
         * then rises toward the right.
         */
        path: `
            M 0 0

            C 120 25,
              230 75,
              360 105

            C 540 150,
              690 175,
              850 145

            C 1010 115,
              1120 55,
              1240 30

            C 1330 12,
              1390 18,
              1440 28

            L 1440 480
            L 0 480
            Z
        `,
        color: "lightRed",
        opacity: 1,
    },

    {
        /**
         * SECOND WAVE
         *
         * Does NOT follow the first wave exactly.
         * Its lowest point is shifted toward the center-right.
         */
        path: `
            M 0 55

            C 150 85,
              270 145,
              420 175

            C 590 210,
              745 225,
              900 180

            C 1050 135,
              1150 82,
              1260 70

            C 1350 60,
              1400 82,
              1440 100

            L 1440 480
            L 0 480
            Z
        `,
        color: "roseRed",
        opacity: 0.94,
    },

    {
        /**
         * THIRD WAVE
         *
         * Larger and more dramatic.
         * Its center trough is lower than the previous wave.
         */
        path: `
            M 0 125

            C 130 145,
              260 205,
              410 235

            C 570 268,
              735 285,
              890 245

            C 1030 210,
              1140 145,
              1240 125

            C 1330 108,
              1395 135,
              1440 155

            L 1440 480
            L 0 480
            Z
        `,
        color: "brightRed",
        opacity: 0.88,
    },

    {
        /**
         * MAIN BRAND-RED WAVE
         *
         * Notice that this does not mirror the wave above.
         *
         * It has a broad sweeping valley which gives
         * the reference its layered / flowing appearance.
         */
        path: `
            M 0 195

            C 130 205,
              255 270,
              390 305

            C 540 345,
              700 355,
              850 315

            C 1000 275,
              1110 210,
              1230 190

            C 1330 175,
              1395 200,
              1440 220

            L 1440 480
            L 0 480
            Z
        `,
        color: "brandRed",
        opacity: 1,
    },

    {
        /**
         * FRONT / DARKEST SWEEP
         *
         * This is deliberately different from all the
         * other waves.
         *
         * It starts lower on the left, rises into the
         * center-left, then sweeps toward the right.
         *
         * This creates the large overlapping PHC-style
         * dark-red shape visible in the reference.
         */
        path: `
            M 0 310

            C 170 300,
              300 275,
              450 285

            C 610 295,
              735 350,
              860 365

            C 1010 385,
              1120 330,
              1210 285

            C 1300 240,
              1380 235,
              1440 250

            L 1440 480
            L 0 480
            Z
        `,
        color: "deepRed",
        opacity: 1,
    },
] as const;

/**
 * SVG coordinate system.
 *
 * 1440 x 480 gives the footer enough vertical room
 * for the independent curves to remain visible.
 */
export const kioskHeaderWave = {
    viewBox: "0 0 1440 480",
} as const;

/**
 * Footer container styles.
 */
export const KioskHeaderStyle = {
    /**
     * Full-width footer.
     *
     * The SVG completely owns the background.
     */
    container: {
        position: "relative",
        width: "100%",
        // clamp(220px, 25vh, 480px)
        height: "clamp(150px, 18vh, 380px)",
        minHeight: kioskHeaderMinHeight,

        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",

        paddingInline: kioskHeaderSpacing.paddingX,
        paddingBlock: kioskHeaderSpacing.paddingY,

        overflow: "hidden",

        backgroundColor: "transparent",
        zIndex: 10,
    },

    /**
     * Left-side brand.
     */
    brand: {
        display: "flex",
        alignItems: "center",
        gap: kioskHeaderSpacing.brandGap,
        position: "relative",
        zIndex: 1,
    },

    /**
     * "Heart Check"
     */
    brandPrimary: {
        color: kioskHeaderTextColor.white,
        fontSize: kioskHeaderFontSize.brand,
        fontWeight: kioskHeaderFontWeight.black,
    },

    /**
     * "PHC"
     */
    brandAccent: {
        color: kioskHeaderTextColor.white,
        fontSize: kioskHeaderFontSize.brand,
        fontWeight: kioskHeaderFontWeight.black,
    },

    /**
     * Right-side clock block.
     */
    clock: {
        textAlign: "right",
        position: "relative",
        zIndex: 1,
    },

    /**
     * Current time.
     */
    time: {
        color: kioskHeaderTextColor.white,
        fontSize: kioskHeaderFontSize.time,
        fontWeight: kioskHeaderFontWeight.black,
        lineHeight: kioskHeaderTimeLineHeight,
        margin: 0,
    },

    /**
     * Current date.
     */
    date: {
        color: kioskHeaderTextColor.white,
        fontSize: kioskHeaderFontSize.date,
        fontWeight: kioskHeaderFontWeight.normal,
        margin: 0,
    },
} satisfies Record<string, CSSProperties>;

/**
 * Visual styling dictionary for the SVG background wave.
 */
export const KioskFooterWaveStyle = {
    svg: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        display: "block",
        pointerEvents: "none",
    },
} satisfies Record<string, CSSProperties>;