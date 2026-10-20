# Kiosk Module Developer Guide: Architecture & Where to Edit

This document is the definitive guide for developers maintaining, modifying, or extending the self-service patient registration kiosk in `app/kiosk/`.

It explains the system architecture, separation-of-concerns conventions, and provides an exhaustive directory mapping showing exactly which files to edit for any visual, textual, layout, or behavioral changes.

_Last updated: 2026-10-20_

---

## 1. Architectural Principles

The kiosk interface strictly enforces a four-layer separation of concerns:

1. **Presentation Components (`components/`):**
   - Pure UI rendering and structure.
   - Zero hardcoded user-facing strings or messages.
   - Zero inline literal styling objects (`style={{ ... }}`).
   - Consume text copy from dedicated `<component>Texts.ts` files.
   - Consume visual styling from dedicated `<component>.ts` files.

2. **Text Dictionaries (`constants/<component>Texts.ts`):**
   - Store all bilingual (Filipino / English) titles, subtitles, button labels, placeholders, and error messages as `as const` objects.
   - Never embed styling or layout configuration in text files.

3. **Style & Token Dictionaries (`constants/<component>.ts`):**
   - Define all static visual styles using typed `Record<string, CSSProperties>` objects.
   - Centralize dimension tokens, color tokens, and font size scales.
   - Centralize interactive Tailwind utility classes (e.g. active animations, hover transforms, focus outlines) in `<Component>Classes` dictionaries.

4. **Layout Shells (`layout.tsx` & `<feature>Layout.ts`):**
   - Define responsive full-viewport wrappers, hydration fade-in transitions, and orientation adjustments (landscape vs portrait).

---

## 2. "Where to Edit" Quick Reference Matrix

Use this lookup table to immediately find the file you need:

| Goal / Intended Change | Where to Edit |
| :--- | :--- |
| **Change global typography scales or kiosk font sizes** | [constants/kiosk.ts](file:///home/jensen/Github-Repositories/heart-check-phc/constants/kiosk.ts) (`kioskTypography` / `fontSizeKiosk`) and [KIOSK_TYPOGRAPHY_GUIDE.md](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/KIOSK_TYPOGRAPHY_GUIDE.md). All kiosk screen styles alias these root tokens. |
| **Change text copy, titles, or button labels** | Look for the matching `constants/<component>Texts.ts` in that route. |
| **Change colors, dimensions, or card padding** | Look for the matching `constants/<component>.ts` in that route. |
| **Change icons or resolve service/category Boxicons** | [constants/icons.ts](file:///home/jensen/Github-Repositories/heart-check-phc/constants/icons.ts) (central icon map and resolvers) or local `<component>.ts` (page-specific icon tokens). |
| **Change layout dimensions, padding, or orientation behavior** | Look for `constants/<feature>Layout.ts` or the route's `layout.tsx`. |
| **Change navigation flow or routing destinations** | Check the page component (`page.tsx`) or [useKioskNavigate.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/hooks/useKioskNavigate.ts). |
| **Change kiosk idle timeout, slideshow images, or slide interval** | [kioskNavigation.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskNavigation.ts) and [idleRedirect.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/idleRedirect.ts). |
| **Change idle-screen accessibility text or activation behavior** | [idleRedirectTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/idleRedirectTexts.ts) and [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/slideshow/page.tsx). |
| **Change loading overlay message or animation** | [kioskLoadingOverlayTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLoadingOverlayTexts.ts) / [kioskLoadingOverlay.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLoadingOverlay.ts). |
| **Change the universal back button appearance or label** | [kioskBackButtonTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskBackButtonTexts.ts) / [kioskBackButton.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskBackButton.ts). |
| **Change the hardware ticket print API payload or format** | [QueuePrintContent.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/components/QueuePrintContent.tsx), [route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/print-ticket/route.ts), and [printer.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/printer.ts). |
| **Change mobile phone number validation rules** | [phoneValidation.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/utils/phoneValidation.ts) (NTC prefixes, sequential runs, repetition limits) and [KioskPhoneEntry.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/KioskPhoneEntry.tsx). |
| **Change Estimated Wait Time (EWT) formulas, ranges, or labels** | [ewtTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/ewtTexts.ts), [ewtComputation.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/print-ticket/ewtComputation.ts), [sendQueueConfirmationSMS.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/actions/sendQueueConfirmationSMS.ts), and [ESTIMATED_WAIT_TIME.md](file:///home/jensen/Github-Repositories/heart-check-phc/docs/specifications/ESTIMATED_WAIT_TIME.md). |
| **Change phone encryption, reveal actions, or security** | [phoneSecurity.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/actions/phoneSecurity.ts), [phoneEncryption.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/crypto/phoneEncryption.ts), and [DATA_ENCRYPTION_GUIDE.md](file:///home/jensen/Github-Repositories/heart-check-phc/docs/specifications/DATA_ENCRYPTION_GUIDE.md). |
| **Change queue ticket prefixes and numeric rules** | [smsPrefixRules.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsPrefixRules.ts). |

---

## 3. Directory Breakdown by Screen

### Root Shell & Common Elements (`app/kiosk/`)

The root layout wraps all kiosk subroutes with client-side hydration awareness, the universal back button, and a global loading overlay.

- **Layout File:** [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/layout.tsx)
- **Loading Overlay Component:** [KioskLoadingOverlay.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/components/KioskLoadingOverlay.tsx)
- **Universal Back Button:** [KioskBackButton.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/components/reusables/KioskBackButton.tsx)
- **Loading State Context:** [KioskLoadingContext.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/context/KioskLoadingContext.tsx)
- **Unified Navigation Hook:** [useKioskNavigate.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/hooks/useKioskNavigate.ts)
- **Idle Activity Timer:** [IdleRedirectWrapper.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/components/IdleRedirectWrapper.tsx) (3-minute inactivity redirect on patient-flow routes).
- **Idle Slideshow:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/slideshow/page.tsx) (cycles the existing `/images/1.jpg`, `/images/2.jpg`, and `/images/3.jpg` assets and returns to patient selection on activation).
- **Constants:**
  - [kioskBackButtonTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskBackButtonTexts.ts): Back button text and ARIA labels (`KioskBackButtonTexts`).
  - [kioskBackButton.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskBackButton.ts): Back button styles with tactile white background, brand red typography and enlarged icon (`clamp(24px, 2.4vmin, 32px)`), generous vertical padding (`clamp(12px, 1.4vh, 18px)`), and touch active border feedback (`KioskBackButtonStyles`, `KioskBackButtonClasses`).
  - [kioskLoadingOverlayTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLoadingOverlayTexts.ts): Default loading spinner status strings (`KioskLoadingOverlayTexts`).
  - [kioskLoadingOverlay.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLoadingOverlay.ts): Loading overlay styling and elevated z-index (200) backdrop filters (`KioskLoadingOverlayStyles`, `KioskLoadingOverlayClasses`).
  - [idleRedirectTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/idleRedirectTexts.ts): Accessibility and screen-reader copy for idle slideshow activation (`IdleRedirectTexts`).
  - [idleRedirect.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/idleRedirect.ts): Full-screen idle slideshow layout, styles, transitions, and image assets (`IdleRedirectStyle`, `IdleRedirectClasses`, `IDLE_SLIDESHOW_IMAGES`).
  - [kioskLayoutTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLayoutTexts.ts): Composite barrel re-export for layout text strings.
  - [kioskLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLayout.ts): Shell layout styles (`KioskLayoutStyle`) and responsive utility classes (`KioskLayoutClasses`).
  - [kioskNavigation.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskNavigation.ts): Kiosk route path and timing constants (`KIOSK_ROUTES`, `KIOSK_TIMING`).

---

### Screen 1: Patient Category Selection (`app/kiosk/pages/kiosk-new-old-selection/`)

The welcome screen where patients indicate whether they are a "New Patient" or "Old / Returning Patient".

- **Route:** `/kiosk/pages/kiosk-new-old-selection`
- **Page File:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/page.tsx)
- **Layout File:** [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/layout.tsx)
- **Components:**
  - [KioskTitle.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/components/KioskTitle.tsx): Main Filipino/English heading.
  - [PatientTypeBanner.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/components/PatientTypeBanner.tsx): Informational instruction callout situated tightly directly above the selection cards.
  - [PatientTypeCards.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/components/PatientTypeCards.tsx): Tappable New/Old selection cards matching canonical `kiosk-services` expansive sizing (`width: "100%"`, `height: "100%"`, `minHeight: "clamp(125px, 13.5vh, 165px)"`, `auto-rows-fr`).
- **Where to Edit Texts:**
  - [kioskTitleTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/kioskTitleTexts.ts): Heading copy (`KioskTitleTexts`).
  - [patientTypeBannerTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeBannerTexts.ts): Banner instructions (`PatientTypeBannerTexts`).
  - _Note:_ Card labels (`Bagong Pasyente`, `Dating Pasyente`) are fetched dynamically from the `patient_category` database table.
- **Where to Edit Styles:**
  - [kioskTitle.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/kioskTitle.ts): Title font size (referencing `kioskTypography.heroTitle`) and alignments (`KioskTitleStyle`).
  - [patientTypeBanner.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeBanner.ts): Banner container, badge styles, and fluid typography (`clamp(28px, 3.2vmin, 44px)`) (`PatientTypeBannerStyle`).
  - [patientTypeCards.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeCards.ts): Standardized card dimensions (`kioskCardDimensions.cardMinHeight`, `cardPaddingX`, `cardPaddingY`, `cardGap`), divider line, and active feedback states (`PatientTypeCardStyle`, `PatientTypeCardsClasses`).
  - [kioskNewOldLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOldLayout.ts): Page layout classes (`KioskNewOldLayoutClasses`) keeping the banner instructions directly above the cards with zero vertical gap or stretching.

---

### Screen 2: Services Menu (`app/kiosk/pages/kiosk-services/`)

Presents clinical services (Consultation, OPD Screening, Med Cert, etc.) fetched from the `services` table.

- **Route:** `/kiosk/pages/kiosk-services?type=<new|old>`
- **Page File:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/page.tsx)
- **Layout File:** [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/layout.tsx) (clean pass-through layout)
- **Components:**
  - [KioskHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/components/KioskHeader.tsx): Top institutional logo and title header.
  - [KioskBanner.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/components/KioskBanner.tsx): Instructional banner above services, aligned with the category-selection header scale.
  - [KioskServicesGrid.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/components/KioskServicesGrid.tsx): Unified container with sticky greetings banner (`headerWrapper`) on top, widened card grid across an expansive container (`max-w-[1650px]`), and dynamic scroll indicators (floating badge with bounce chevron and top/bottom gradient shadows).
  - [ServiceCard.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/components/ServiceCard.tsx): Widened interactive service card with Filipino title, gray divider line, English subtitle, brand red icon, and active feedback arrow.
  - [KioskFooterWave.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/components/KioskFooterWave.tsx): Decorative bottom wave graphic.
- **Where to Edit Texts:**
  - [kioskHeaderTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/constants/kioskHeaderTexts.ts): Header institutional title (`KioskHeaderTexts`).
  - [kioskBannerTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/constants/kioskBannerTexts.ts): Banner instructions (`KioskBannerTexts`).
  - [kioskServicesTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/constants/kioskServicesTexts.ts): Scroll-down indicator badge copy and accessibility ARIA labels (`KioskServicesTexts`).
  - _Note:_ Service titles (`label_fil`) and English subtitles (`label_en`) are fetched from the `services` database table.
- **Where to Edit Styles:**
  - [kioskHeader.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/constants/kioskHeader.ts): Header dimensions, logo sizing, and footer typography referencing `kioskTypography` (`KioskHeaderStyle`, `kioskHeaderFontSize`).
  - [kioskBanner.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/constants/kioskBanner.ts): Banner styling referencing `kioskTypography.pageTitle` and `pageSubtitle` (`KioskBannerStyle`, `kioskBannerTypography`).
  - [kioskServices.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/constants/kioskServices.ts): Layout container and widened content wrapper styles (`maxWidth: "1650px"`), centered layout classes (`justifyContent: "center"` on container and `maxHeight: "100%"` on `contentWrapper` with `m-auto` ensuring vertical and horizontal centering in both portrait and landscape), widened card styling (`KioskServicesCardStyle`, `cardPaddingX: "clamp(20px, 2.6vmin, 36px)"`), scroll indicator pill (`scrollIndicator`), scroll shadows (`scrollTopShadow`, `scrollBottomShadow`), text overflow protection with break-word wrapping (`overflowWrap: "anywhere"`), enlarged fluid icon sizing (`clamp(48px, 5.2vmin, 76px)`), gray divider line (`divider`), English subtitle (`subtitle`), typography referencing `kioskTypography`, grid spacing (`KioskServicesGridStyle`), sticky greetings banner (`headerWrapper`), and scrollable card area (`cardsScrollArea`).

---

### Screen 3: Age Category Selection (`app/kiosk/pages/category-selection/`)

Unified age-bracket selector for services requiring Adult (19+) vs Pedia (18 and below) triage.

- **Route:** `/kiosk/pages/category-selection?serviceId=...&type=...&serviceLabel=...`
- **Page File:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/page.tsx)
- **Where to Edit Texts:**
  - [categoryHeaderTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/constants/categoryHeaderTexts.ts): Header question text (`CategoryHeaderTexts`).
  - [categoryCardsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/constants/categoryCardsTexts.ts): Adult / Pedia bilingual labels and scroll indicator texts (`CategoryCardsTexts`).
- **Where to Edit Styles:**
  - [categoryHeader.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/constants/categoryHeader.ts): Heading typography referencing `kioskTypography` and margins (`CategoryHeaderStyle`).
  - [categoryCards.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/constants/categoryCards.ts): Standardized card dimensions (`minHeight: clamp(125px, 13.5vh, 165px)`, `paddingX`, `paddingY`, `cardsGap`), 2px divider line, fluid clamp icon (`clamp(48px, 5.2vmin, 76px)`) and arrow sizing (`clamp(26px, 2.6vmin, 36px)`), word wrapping on titles without clipping (`overflowWrap: "anywhere"`), horizontal card button layout (icon on left, Filipino title, gray divider line, English subtitle in middle, directional arrow on right), touch active border/arrow highlight classes, typography referencing `kioskTypography`, and card styles (`CategoryCardsStyle`, `CategoryCardsClasses`).
  - [categoryLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/constants/categoryLayout.ts): Page container styles and scroll wrapper architecture (`CategoryLayoutStyle`, `CategoryLayoutClasses`) providing sticky greetings header, top/bottom gradient shadows, floating scroll indicator badge, and scrollable buttons area with `cardsScrollArea`.

---

### Screen 4: Cubicle Selection (`app/kiosk/pages/kiosk-cubicle-selection/`)

Consultation doctor / room selection step.

- **Route:** `/kiosk/pages/kiosk-cubicle-selection?serviceId=...&type=...&subcategory=...`
- **Page File:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/page.tsx)
- **Layout File:** [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/layout.tsx) (clean pass-through layout)
- **Components:**
  - [CubicleHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/components/CubicleHeader.tsx): Top header prompt.
  - [CubicleCardsGrid.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/components/CubicleCardsGrid.tsx): Scrollable cubicle grid with top/bottom gradient shadows, floating scroll indicator badge, and ResizeObserver tracking.
  - [CubicleCard.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/components/CubicleCard.tsx): Cubicle button displaying cubicle designation, divider line, and assigned active physician (`Dr. <Name>`), forwarding preferred cubicle numbers and `cubicleNum` selection identifier to SMS input.
- **Where to Edit Texts:**
  - [cubicleHeaderTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleHeaderTexts.ts): Header title and subtitle (`CubicleHeaderTexts`).
  - [cubicleCardTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleCardTexts.ts): Card text tokens including doctor title prefix, fallback copy, and scroll indicator text (`CubicleCardTexts`).
  - _Note:_ Cubicle names and active doctor assignments are fetched dynamically from the database (`cubicle_selector`, `cubicle`, and `doctors` tables).
- **Where to Edit Styles:**
  - [cubicleHeader.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleHeader.ts): Header styles and typography referencing `kioskTypography` (`CubicleHeaderStyle`).
  - [cubicleCard.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleCard.ts): Standardized card styling matching `kiosk-services` (`minHeight: clamp(125px, 13.5vh, 165px)`, `cardPaddingX`, `cardPaddingY`, `cardGap`), doctor row subtitle, 2px divider line, multi-line wrapping for long cubicle names and physician credentials without ellipsis truncation (`whiteSpace: "normal"`, `overflowWrap: "anywhere"`, `wordBreak: "break-word"`), brand red icon (`clamp(48px, 5.2vmin, 76px)`), directional arrow (`clamp(26px, 2.6vmin, 36px)`), typography referencing `kioskTypography`, and touch active border/arrow highlight classes (`CubicleCardStyle`, `CubicleCardClasses`).
  - [cubicleLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleLayout.ts): Layout wrapper styles and scroll tokens (`CubicleLayoutStyle`, `CubicleLayoutClasses`) providing scrollable wrapper architecture (`scrollWrapper`, `cardsScrollArea`, `scrollTopShadow`, `scrollBottomShadow`, `scrollIndicator`).

---

### Screen 5: SMS Phone Entry (`app/kiosk/pages/sms-input/`)

Keypad screen for entering the patient's Philippine mobile number (`09XX XXX XXXX`) for SMS queue notifications. Cleaned and redesigned to match the borderless white aesthetic of other kiosk screens with the universal top-left back button.

- **Route:** `/kiosk/pages/sms-input?serviceId=...&type=...&subcategory=...&preferredCubicleNums=...&cubicleNum=...`
- **Page File:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/page.tsx)
- **Layout File:** [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/layout.tsx)
- **Universal Back Button:** Supported via [app/kiosk/layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/layout.tsx) routing dynamically back to cubicle selection (for Consultation), category selection (for OPD Screening), or the main services catalog (for direct services).
- **Components:**
  - [SMSHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/SMSHeader.tsx): Centered dual-language header ("Ilagay ang Mobile Number" / "Enter Mobile Number") and service pill badge.
  - [SMSInstruction.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/SMSInstruction.tsx): Informative notice card explaining SMS queue notifications.
  - [PhoneInput.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/PhoneInput.tsx): Formatted phone number display box with backspace button and touch scaling.
  - [NumPad.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/NumPad.tsx): On-screen touch keypad with clean white card keys, 2px borders, and tactile active red border feedback (`active:!border-[#ED1C24]`).
  - [ContinueButton.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/ContinueButton.tsx): Primary "Magpatuloy - Continue" button and secondary "Laktawan - Skip" button with confirmation modals.
  - [KioskPhoneEntry.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/KioskPhoneEntry.tsx): State orchestration for number input, responsive layout, database patient ticket creation via RPC (`create_patient`), and cubicle-aware forwarding to queue print.
- **Where to Edit Texts:**
  - [smsInstructionTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsInstructionTexts.ts): Input title, subtitle, and hint card message (`SMSInstructionTexts`).
  - [smsContinueButtonTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsContinueButtonTexts.ts): Continue and Skip button labels (`SMSContinueButtonTexts`).
  - [smsModalTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsModalTexts.ts): Verification modal and skip confirmation modal texts (`SMSModalTexts`).
  - [smsValidationTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsValidationTexts.ts): Phone number format warnings and troll rejection messages (`SMSValidationTexts`).
- **Where to Edit Styles:**
  - [smsInstruction.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsInstruction.ts): Header, subtitle, service badge, and hint card styles referencing `kioskTypography` (`SMSInstructionStyle`).
  - [smsPhoneInput.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsPhoneInput.ts): Number box border, enlarged height (`clamp(70px, 8.5vh, 88px)`), colors, and typography referencing `kioskTypography.phoneDigits` (`SMSPhoneInputStyle`, `SMSPhoneInputClasses`).
  - [smsNumPad.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsNumPad.ts): Touch keypad button sizing with enlarged height (`clamp(70px, 8.5vh, 90px)`) and comfortable touch grid, colors, typography referencing `kioskTypography.numPadKey`, and active press states with red border (`SMSNumPadStyle`, `SMSNumPadClasses`).
  - [smsContinueButton.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsContinueButton.ts): Primary continue and secondary skip button styles referencing `kioskTypography.buttonText` with enlarged touch heights (`clamp(54px, 6.8vh, 68px)`), fluid padding, and word-wrap protection (`SMSContinueButtonStyle`, `SMSContinueButtonClasses`).
  - [smsLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsLayout.ts): Keypad screen layout and column wrappers (`SMSLayoutStyle`, `SMSLayoutClasses`), strictly non-scrollable (`overflow: hidden`) with balanced padding and gaps, portrait column width constraints (`max-w-[540px]`), and centered alignment.
- **Where to Edit Phone Validation & Anti-Troll Rules:**
  - [phoneValidation.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/utils/phoneValidation.ts): Strict Philippine mobile number rules, 09 keypad constraint, NTC telco prefix verification, sequential run detection (`123456...`), and repetitive number limits (`09111111111`).
- **Where to Edit Phone Encryption & Security:**
  - [phoneSecurity.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/actions/phoneSecurity.ts): Server actions isolating phone encryption and masking logic.
  - [phoneEncryption.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/crypto/phoneEncryption.ts): Core AES-256-GCM cipher and key management.
  - [DATA_ENCRYPTION_GUIDE.md](file:///home/jensen/Github-Repositories/heart-check-phc/docs/specifications/DATA_ENCRYPTION_GUIDE.md): Architecture specifications and database migration guide.
- **Where to Edit Queue Ticket Prefixes & Rules:**
  - [smsPrefixRules.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsPrefixRules.ts): Default service ticket prefix mappings (`SMS_SERVICE_PREFIXES`) and numeric subcategory routing rules (`NUMERIC_PREFIX_RULES`).
  - [customization/page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/superadmin/customization/page.tsx): SuperAdmin service catalog management allowing custom print queue prefixes (`queue_prefix` — first letter/number on queue number) and digit padding (`queue_pad_length`) persisted directly on the `services` table.
  - [KioskPhoneEntry.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/KioskPhoneEntry.tsx): Dynamic prefix resolution hierarchy prioritizing `services.queue_prefix`, followed by `app_settings.queue_prefix_map`, and finally code defaults.


---

### Screen 6: Confirmation Screen (`app/kiosk/pages/confirmation/`)

Review screen displaying the patient's selected service, category, and phone number before submitting to the database.

- **Route:** `/kiosk/pages/confirmation`
- **Page File:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/page.tsx)
- **Layout File:** [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/layout.tsx)
- **Components:**
  - [ConfirmationBanner.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/components/ConfirmationBanner.tsx): Notice banner.
  - [ConfimationDescription.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/components/ConfimationDescription.tsx): Summary details (Service, Category, Phone).
  - [ConfirmationActions.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/components/ConfirmationActions.tsx): "Confirm" and "Edit" action buttons.
  - [ConfirmationModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/components/ConfirmationModal.tsx): Final modal dialog, portaled directly to `document.body` via `createPortal` with elevated `z-[100]` and `backdrop-blur-md` (blur 8px) to cleanly blur the full page layout and ensure navigation controls like the universal back button are properly obscured and inaccessible while active.
- **Where to Edit Texts:**
  - [confirmationDescriptionTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationDescriptionTexts.ts): Field labels (Service, Subcategory, Phone Number) (`ConfirmationDescriptionTexts`).
  - [confirmationActionsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationActionsTexts.ts): Confirm and Cancel button labels (`ConfirmationActionsTexts`).
  - [confirmationModalTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationModalTexts.ts): Modal prompt and confirmation buttons (`ConfirmationModalTexts`).
  - [confirmationLayoutTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationLayoutTexts.ts): Confirmation heading instructions (`ConfirmationLayoutTexts`).
- **Where to Edit Styles:**
  - [confirmationBanner.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationBanner.ts): Banner styles (`ConfirmationBannerStyle`).
  - [confirmationDescription.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationDescription.ts): Summary card styles (`ConfirmationDescriptionStyle`).
  - [confirmationActions.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationActions.ts): Action button styles with enlarged touch minHeight (`clamp(54px, 6.5vh, 66px)`), fluid clamp padding, and break-word wrapping (`ConfirmationActionsStyle`).
  - [confirmationModal.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationModal.ts): Modal overlay styles (`zIndex: 100`, `backdropFilter: blur(8px)`) and dialog styles (`ConfirmationModalStyle`, `ConfirmationModalClasses`).
  - [confirmationLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationLayout.ts): Layout wrappers (`ConfirmationLayoutClasses`).

---

### Screen 7: Queue Ticket Printing (`app/kiosk/pages/queue-print/`)

Final completion screen presenting the physical queue ticket preview, triggering the hardware thermal printer API (`/api/print-ticket`), and returning to the entrance after a 5-second countdown. Optimized for elderly patient accessibility with enlarged typography, high-contrast text without pillboxes, Philippine Standard Time (PHT), destination cubicle ("Cubicle:"), prominent queue number, and clear bilingual registration guidance.

- **Route:** `/kiosk/pages/queue-print?patientNum=...&serviceId=...&cubicleNum=...`
- **Page File:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/page.tsx)
- **Layout File:** [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/layout.tsx)
- **Components:**
  - [PrintHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/components/PrintHeader.tsx): "Maraming Salamat po / Thank you" banner.
  - [PrintFooter.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/components/PrintFooter.tsx): Waiting instructions.
  - [QueuePrintContent.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/components/QueuePrintContent.tsx): Printed ticket display card, printer API invocation, and automatic timeout redirect.
- **Where to Edit Texts:**
  - [printHeaderTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/printHeaderTexts.ts): Header thank you copy (`PrintHeaderTexts`).
  - [printFooterTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/printFooterTexts.ts): Footer waiting instructions (`PrintFooterTexts`).
  - [queuePrintTicketTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/queuePrintTicketTexts.ts): Ticket card labels, metadata prefixes, default destination, accessible copy, and EWT section headers (`QueuePrintTicketTexts`).
  - [ewtTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/ewtTexts.ts): Centralized Estimated Wait Time range definitions, bilingual labels, and disclaimers (`EWT_TEXTS`, `formatEwtLabel`).
- **Where to Edit Styles:**
  - [printHeader.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/printHeader.ts): Header typography (`PrintHeaderStyle`).
  - [printFooter.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/printFooter.ts): Footer notice typography (`PrintFooterStyle`).
  - [queuePrintTicket.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/queuePrintTicket.ts): Ticket card dimensions, senior-friendly typography scales without pillboxes, queue callout, dividers, Manila timestamp, cubicle row (`QueuePrintTicketStyle`), and redirect delay (`QUEUE_PRINT_REDIRECT_DELAY_MS`).
  - [queuePrintLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/queuePrintLayout.ts): Print screen layout classes (`QueuePrintLayoutClasses`).

---

### Screen 8: Idle Slideshow (`app/kiosk/slideshow/`)

Full-screen promotional and institutional slideshow that displays automatically after 3 minutes of inactivity on patient-flow screens. Automatically cycles through images with smooth cross-fade transitions across the entire screen, and returns patients immediately to the entrance route upon screen activation.

- **Route:** `/kiosk/slideshow`
- **Page File:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/slideshow/page.tsx)
- **Subcomponents:**
  - [KioskTapPrompt.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/slideshow/components/KioskTapPrompt.tsx): Floating "Tap to Start" tactile callout badge guiding patients to begin interaction.
- **Idle Timeout Watcher:** [IdleRedirectWrapper.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/components/IdleRedirectWrapper.tsx) (monitors pointer, touch, and keyboard activity across `/kiosk/pages/*` and redirects to `/kiosk/slideshow` on 3-minute timeout).
- **Where to Edit Texts:**
  - [idleRedirectTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/idleRedirectTexts.ts): Screen-reader and visible "Tap to Start" callout copy (`IdleRedirectTexts`).
- **Where to Edit Styles, Intervals, & Images:**
  - [idleRedirect.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/idleRedirect.ts): Full-screen touch control styles, "Tap to Start" badge styles, opacity classes, and image asset paths (`IdleRedirectStyle`, `IdleRedirectClasses`, `IDLE_SLIDESHOW_IMAGES`).
  - [kioskNavigation.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskNavigation.ts): Inactivity redirect threshold (`IDLE_REDIRECT_MS = 180000`, 3 minutes) and slide rotation speed (`SLIDESHOW_INTERVAL_MS = 6000`, 6 seconds) (`KIOSK_TIMING`).

---

## 4. Developer Rules for Kiosk Modifications

Whenever you create or edit code in `app/kiosk/`:

1. **No Hardcoded Text:**
   Never write user-visible English or Filipino strings inside TSX files. Create or update `<component>Texts.ts` and import the text constant.

2. **No Inline Literal Style Objects:**
   Never write `style={{ color: "red", fontSize: 16 }}` inside JSX. Create or update `<component>.ts` and reference typed style objects (`style={FeatureStyle.propertyName}`).

3. **Keep Barrel Files Synchronized:**
   Whenever a new component constant file is added (e.g. `fooTexts.ts` or `foo.ts`), re-export it from the route's central barrel files (`<feature>Texts.ts` and `<feature>.ts`) to ensure backwards compatibility.

4. **Preserve Orientation Handling:**
   The kiosk operates on touchscreen hardware supporting both Portrait and Landscape orientations. When writing layouts or padding, always verify both orientations using `useIsLandscape()` or Tailwind `landscape:` and `portrait:` variants.

5. **No Emojis Anywhere:**
   Emojis are strictly prohibited in documentation (`.md`), code comments, JSDoc annotations, commit messages, and user-facing text.

6. **Comprehensive Documentation:**
   Every new or refactored file must include a top-level JSDoc `@file` comment and symbol-level JSDoc annotations for all components, interfaces, and exported constants.

7. **Universal Scrollable Architecture Standard:**
   All selection screens ([kiosk-services](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/page.tsx), [category-selection](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/page.tsx), [kiosk-cubicle-selection](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/page.tsx), and [kiosk-new-old-selection](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/layout.tsx)) implement the unified scrollable architecture established by `kiosk-services`:
   - **Sticky Top Greeting/Header:** The prompt sits directly above cards inside `contentWrapper` with zero unnecessary vertical gap.
   - **Top Gradient Shadow (`scrollTopShadow`):** Rendered dynamically when `canScrollUp` is true, providing smooth visual fading at the top edge.
   - **Scrollable Cards Area (`cardsScrollArea`):** Overflow vertical scroll container with custom slim scrollbar styles and touch overscroll containment.
   - **Bottom Gradient Shadow (`scrollBottomShadow`):** Rendered dynamically when `canScrollDown` is true, indicating more options exist below the fold.
   - **Floating Scroll Indicator Badge (`scrollIndicator`):** Centered floating pill with uppercase badge label and bouncing chevron icon. Tapping triggers smooth programmatic scroll down (`scrollBy({ top: clientHeight * 0.7, behavior: "smooth" })`). Automatically hides when scrolled to bottom.
   - **Automated Viewport Synchronization:** Combines scroll event listeners, window resize events, and `ResizeObserver` tracking to keep scroll indicators perfectly accurate across viewport size and orientation changes.

8. **Always Center Kiosk UI & Non-Overflow Navigation:**
   Every kiosk screen, whether fixed or scrollable, must ALWAYS center its content both vertically and horizontally in the available viewport.
   - **Non-Overflow Navigation (In-Flow):** The universal back button is rendered in its own dedicated in-flow top navigation row (`topNavWrapper`) in `app/kiosk/layout.tsx`. It is strictly `inline-flex` and never absolute, guaranteeing that no headers, banners, or instruction texts ever share a row or collide with the back button.
   - **Centered Content Area (`<main>`):** All page contents (headers, banners, cards, instructions, numeric keypads) are rendered inside `<main>`, vertically and horizontally centered in the available space between the top navigation bar and the footer wave.
   - **Greetings Directly on Top of Selection Buttons:** On every selection screen, the greetings banner or instruction prompt sits directly on top of the selection cards with zero empty space or gap separating them. No vertical auto-margins (`m-auto`) inside scroll containers may pull or push cards away from the header.
   - **Unified Content Wrapper Centering:** Across [kiosk-services](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/page.tsx), [category-selection](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/page.tsx), [kiosk-cubicle-selection](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/page.tsx), and [kiosk-new-old-selection](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/layout.tsx), the container and `contentWrapper` use `m-auto flex flex-col items-center justify-center` so that the greetings prompt and cards are centered cleanly on the page as one block directly between the top navigation back button and the footer.

9. **Canonical Expansive Card Specification (`kiosk-services` reference):**
   All interactive cards (service cards, cubicle selector cards, age category cards, patient type cards) must adhere strictly to the canonical expansive dimensions, typography, and structure established by `kiosk-services` and defined by `kioskCardDimensions` in `constants/kiosk.ts`:
   - **Expansive Fluid Dimensions:** 
     - Fluid Height: `height: "100%"`, `minHeight: "clamp(125px, 13.5vh, 165px)"`, and `gridAutoRows: "1fr"` (`auto-rows-fr`).
     - Natural Track Fill: `width: "100%"`, expanding naturally to fill grid columns without artificial `maxWidth` caps or fixed heights.
     - Grid Containers: Multi-card grids span up to `max-w-[1650px]` in landscape (3 columns) or `max-w-[1150px]` in portrait (2 columns), using `auto-rows-fr` for perfectly balanced row heights.
     - Spacing & Borders: Horizontal padding `clamp(20px, 2.6vmin, 36px)`, vertical padding `clamp(16px, 1.8vh, 24px)`, card gap `clamp(14px, 1.8vmin, 22px)`, 16px corner radius, 2px solid border (`#D1D5DB`), and solid white background.
   - **Left Icon Tile:** Fixed width container (`width: "clamp(52px, 5.2vmin, 76px)"`, `flexShrink: 0`) centering a brand red Boxicon (`fontSize: "clamp(48px, 5.2vmin, 76px)"`, `lineHeight: 1`).
   - **Middle Column Labels:** Fluid label container with `paddingLeft: "clamp(6px, 1vmin, 12px)"`, `flex: 1`, `minWidth: 0`. Comprises:
     1. Primary Filipino Title: `fontSize: kioskTypography.cardTitle`, `fontWeight: 900`, `lineHeight: 1.2`.
     2. Horizontal Divider: `height: 2`, `width: "100%"`, `backgroundColor: "#E5E7EB"`, `borderRadius: 4`, `marginTop: 6`, `marginBottom: 6`.
     3. Secondary Subtitle / Doctor Name: `fontSize: kioskTypography.cardSubtitle`, `fontWeight: 600`, `color: "#4B5563"`, `lineHeight: 1.25`.
   - **Right Directional Arrow:** Fluid arrow icon (`fontSize: "clamp(26px, 2.6vmin, 36px)"`, `color: "#D7D6D6"`) with smooth transition to brand red (`#ED1C24`) and horizontal translation (`translate-x-1`) on active card press.
   - **Touch Feedback:** Tactile scale and border active states: `active:scale-[0.98] active:!border-[#ED1C24] active:shadow-sm`.
   - **Zero Text Ellipsis / Truncation:** Never use `truncate` or `text-ellipsis` on clinical data, services, or doctor names. All text must wrap cleanly using `overflowWrap: "anywhere"`, `wordBreak: "break-word"`, and `whiteSpace: "normal"`.


