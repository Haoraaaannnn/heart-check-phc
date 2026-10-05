# Landing Page Developer Guide & Where to Edit Map

This guide documents the architecture, component hierarchy, design tokens, and editing locations for the Public Landing Page (`app/page.tsx`).

---

The Public Landing Page serves as the institutional entry point to the Heart Check PHC platform. It adheres strictly to the enterprise standards defined in `AGENTS.md`:
- High-contrast solid surfaces with neutral grayish dark mode (`bg-slate-50 dark:bg-[#0d0d0d]`, `bg-white dark:bg-[#1a1a1a]`)
- Crisp 1-pixel borders (`border-slate-200 dark:border-[#2e2e2e]`)
- Centralized themes and sizing tokens defined once in [`constants/themeTokens.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/constants/themeTokens.ts) and consumed across feature styles
- Flawless dual-theme support (light and dark mode via `next-themes`)
- Synchronized Manila clock display
- Complete separation of concerns: UI components only assemble and render without hardcoded text copy or inline styling objects

---

## File Structure

```
app/
├── page.tsx                               # Page orchestrator component
└── landing/
    ├── README.md                          # This developer guide
    ├── components/
    │   ├── LandingHeader.tsx              # Top navigation bar, Manila clock, theme toggle
    │   ├── LandingHero.tsx                # Hero presentation, mission headline, CTA buttons
    │   ├── LandingFeatures.tsx            # Subsystem capability cards grid
    │   ├── LandingWorkflow.tsx            # 4-stage clinical sequence cards
    │   └── LandingFooter.tsx              # Institutional footer, legal disclaimer, version
    └── constants/
        ├── landingTexts.ts                # Centralized text copy and content dictionary
        └── landingStyles.ts               # High-contrast solid surface styling tokens
```

---

## Mandatory "Where to Edit" Reference Map

Use this lookup table to identify the exact file to modify for any change:

| Type of Modification | Target File | Description |
| :--- | :--- | :--- |
| **Centralized surface themes, dark mode colors, or sizing scales** | [`constants/themeTokens.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/constants/themeTokens.ts) | Universal surface, text, border, and size token dictionary |
| **Hero headline, subtitles, or platform description** | [`app/landing/constants/landingTexts.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/landing/constants/landingTexts.ts) | Modify `LANDING_TEXTS.hero` dictionary properties |
| **Clinical subsystem card titles, descriptions, and badges** | [`app/landing/constants/landingTexts.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/landing/constants/landingTexts.ts) | Modify `LANDING_TEXTS.features.items` array |
| **Workflow step labels and explanations** | [`app/landing/constants/landingTexts.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/landing/constants/landingTexts.ts) | Modify `LANDING_TEXTS.workflow.steps` array |
| **Legal disclaimers, institution address, or footer links** | [`app/landing/constants/landingTexts.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/landing/constants/landingTexts.ts) | Modify `LANDING_TEXTS.footer` dictionary properties |
| **Surface colors, cards, borders, and dark mode classes** | [`app/landing/constants/landingStyles.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/landing/constants/landingStyles.ts) | Modify `LANDING_STYLES` dictionary tokens |
| **Top header layout, clock formatting, or action triggers** | [`app/landing/components/LandingHeader.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/landing/components/LandingHeader.tsx) | Navigation component logic and theme toggle handling |
| **Hero action buttons or live telemetry pill logic** | [`app/landing/components/LandingHero.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/landing/components/LandingHero.tsx) | Hero layout and navigation triggers |
| **Subsystem card rendering or icon presentation** | [`app/landing/components/LandingFeatures.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/landing/components/LandingFeatures.tsx) | Features grid component markup |
| **Workflow progression layout or step numbers** | [`app/landing/components/LandingWorkflow.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/landing/components/LandingWorkflow.tsx) | Workflow sequence rendering |
| **Page assembly or section ordering** | [`app/page.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/page.tsx) | Root page orchestrator layout |
