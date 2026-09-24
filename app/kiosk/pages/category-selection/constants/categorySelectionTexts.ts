/**
 * Text copy shared by the unified age-category selection screen.
 *
 * Used by both Consultation and OPD Screening flows — provides bilingual
 * headings, category labels for Adult (19+) and Pedia (18 and below), and button CTA.
 */
export const categorySelectionTexts = {
    titleFil: "Piliin ang naaayon sa iyong edad:",
    titleEn: "Select based on your age:",
    adultLabelFil: "Adult (19 Pataas)",
    adultLabelEn: "19 years old and above",
    pediaLabelFil: "Pedia (18 Pababa)",
    pediaLabelEn: "18 years old and below",
    /** CTA text inside each category card. */
    cta: "Piliin",
} as const;
