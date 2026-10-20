# ADR 005: High-Contrast Solid Clinical Surfaces

## Status
Accepted

## Context
Modern web design trends often employ translucent glassmorphism (`backdrop-blur`, milky semi-transparent gradients, glowing borders, high-contrast neon accents). While visually flashy in consumer web apps, glassmorphism introduces major ergonomic problems in hospital environments:
- Variable fluorescent overhead lighting in clinics washes out low-contrast translucent cards.
- Glare on hospital touchscreens reduces legibility for elderly patients and busy healthcare workers.
- Blurry backdrop filters incur GPU rendering overhead on low-power hospital thin clients and legacy tablet workstations.

## Decision
We standardized on **high-contrast solid surfaces and enterprise workstation ergonomics** (codified in AGENTS.md Rule 10):
1. **Solid Surfaces:** Use high-contrast solid backgrounds (`bg-slate-50 dark:bg-slate-950`, `bg-white dark:bg-slate-900`) with crisp 1-pixel borders (`border-slate-200 dark:border-slate-800`).
2. **Subtle Elevation:** Rely on crisp, low-spread elevation shadows (`shadow-xs` / `shadow-sm`) instead of blurry glass glows.
3. **Dual-Theme Stability:** Support flawless light and dark mode toggling with zero hydration mismatch (`mounted && resolvedTheme === 'dark'`) and explicit dark styling on native `<option>` tags in form dropdowns.
4. **Standard Enterprise Navigation:** Maintain a desktop left-rail sidebar (`w-64`), sticky top header with live Manila clock (Philippine Standard Time), breadcrumbs, and instant profile sign-out.

## Consequences
- **Positive:** Superior legibility under harsh clinic lighting conditions.
- **Positive:** Dramatically reduced rendering overhead and butter-smooth scrolling on low-spec kiosk touchscreens and hospital tablets.
- **Positive:** Professional, enterprise medical workstation appearance.
- **Trade-off:** Eschews trendy translucent glass aesthetics in favor of utilitarian clarity.
