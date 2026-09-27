import { themeColors } from "@/constants/colors";
import { KioskFooterWaveStyle } from "@/app/kiosk/pages/kiosk-services/constants/kioskHeader";

const kioskFooterWave = {
    viewBox: "0 0 1024 420",
};

const kioskFooterWaveLayers: {
    color: keyof typeof themeColors;
    opacity: number;
    path: string;
}[] = [
    /*
     * BACKGROUND LIGHT RED
     *
     * Large sweeping wave entering from the left
     * and rising toward the right.
     */
    {
        color: "brightRed",
        opacity: 0.65,
        path: `
            M 0 40

            C 150 65, 260 150, 410 175
            C 570 202, 720 175, 850 105
            C 925 65, 975 42, 1024 38

            L 1024 420
            L 0 420

            Z
        `,
    },

    /*
     * SECOND LIGHT RED WAVE
     *
     * Notice that this does NOT follow the first wave.
     */
    {
        color: "brightRed",
        opacity: 0.75,
        path: `
            M 0 90

            C 135 125, 260 205, 415 220
            C 560 235, 680 195, 805 125
            C 900 72, 965 68, 1024 82

            L 1024 420
            L 0 420

            Z
        `,
    },

    /*
     * LARGE MIDDLE RED WAVE
     *
     * This is intentionally much deeper in the center.
     */
    {
        color: "brightRed",
        opacity: 0.9,
        path: `
            M 0 135

            C 120 165, 220 250, 390 270
            C 555 290, 680 240, 790 165
            C 885 100, 950 105, 1024 125

            L 1024 420
            L 0 420

            Z
        `,
    },

    /*
     * MAIN BRAND RED WAVE
     *
     * Large sweeping curve from bottom-left
     * toward upper-right.
     */
    {
        color: "brandRed",
        opacity: 0.9,
        path: `
            M 0 210

            C 115 235, 225 315, 375 335
            C 525 355, 650 315, 755 235
            C 860 155, 950 160, 1024 190

            L 1024 420
            L 0 420

            Z
        `,
    },

    /*
     * DARK BASE WAVE
     *
     * This produces the large dark-red foreground
     * seen in the reference.
     */
    {
        color: "brandRed",
        opacity: 1,
        path: `
            M 0 285

            C 120 305, 215 365, 350 385
            C 495 407, 615 375, 730 300
            C 830 235, 930 235, 1024 265

            L 1024 420
            L 0 420

            Z
        `,
    },
];

export default function KioskFooterWave() {
    return (
        <svg
            viewBox={kioskFooterWave.viewBox}
            preserveAspectRatio="none"
            aria-hidden="true"
            style={KioskFooterWaveStyle.svg}
        >
            {kioskFooterWaveLayers.map((layer, index) => (
                <path
                    key={index}
                    d={layer.path}
                    fill={themeColors[layer.color]}
                    opacity={layer.opacity}
                />
            ))}
        </svg>
    );
}