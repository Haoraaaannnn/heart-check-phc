# Kiosk Module Developer Guide: Architecture & Where to Edit

This document is the definitive guide for developers maintaining, modifying, or extending the self-service patient registration kiosk in `app/kiosk/`.

It explains the system architecture, separation-of-concerns conventions, and provides an exhaustive directory mapping showing exactly which files to edit for any visual, textual, layout, or behavioral changes.

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
| **Change global typography scales or kiosk font sizes** | [constants/kiosk.ts](file:///home/jensen/Github-Repositories/heart-check-phc/constants/kiosk.ts) (`kioskTypography` / `fontSizeKiosk`). All kiosk screen styles alias these root tokens. |
| **Change text copy, titles, or button labels** | Look for the matching `constants/<component>Texts.ts` in that route. |
| **Change colors, dimensions, or card padding** | Look for the matching `constants/<component>.ts` in that route. |
| **Change icons or resolve service/category Boxicons** | [constants/icons.ts](file:///home/jensen/Github-Repositories/heart-check-phc/constants/icons.ts) (central icon map and resolvers) or local `<component>.ts` (page-specific icon tokens). |
| **Change layout dimensions, padding, or orientation behavior** | Look for `constants/<feature>Layout.ts` or the route's `layout.tsx`. |
| **Change navigation flow or routing destinations** | Check the page component (`page.tsx`) or `app/kiosk/hooks/useKioskNavigate.ts`. |
| **Change loading overlay message or animation** | [kioskLoadingOverlayTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLoadingOverlayTexts.ts) / [kioskLoadingOverlay.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLoadingOverlay.ts). |
| **Change the universal back button appearance or label** | [kioskBackButtonTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskBackButtonTexts.ts) / [kioskBackButton.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskBackButton.ts). |
| **Change the hardware ticket print API payload or format** | [QueuePrintContent.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/components/QueuePrintContent.tsx), [route.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/api/print-ticket/route.ts), and [printer.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/printer.ts). |
| **Change mobile phone number validation rules** | [phoneValidation.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/utils/phoneValidation.ts) (NTC prefixes, sequential runs, repetition limits) and [KioskPhoneEntry.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/KioskPhoneEntry.tsx). |
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
- **Constants:**
  - [kioskBackButtonTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskBackButtonTexts.ts): Back button text and ARIA labels (`KioskBackButtonTexts`).
  - [kioskBackButton.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskBackButton.ts): Back button styles with tactile white background, brand red typography and enlarged icon (`clamp(24px, 2.4vmin, 32px)`), generous vertical padding (`clamp(12px, 1.4vh, 18px)`), and touch active border feedback (`KioskBackButtonStyles`, `KioskBackButtonClasses`).
  - [kioskLoadingOverlayTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLoadingOverlayTexts.ts): Default loading spinner status strings (`KioskLoadingOverlayTexts`).
  - [kioskLoadingOverlay.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLoadingOverlay.ts): Loading overlay styling and elevated z-index (200) backdrop filters (`KioskLoadingOverlayStyles`, `KioskLoadingOverlayClasses`).
  - [kioskLayoutTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLayoutTexts.ts): Composite barrel re-export for layout text strings.
  - [kioskLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLayout.ts): Shell layout styles (`KioskLayoutStyle`) and responsive utility classes (`KioskLayoutClasses`).
  - [kioskNavigation.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskNavigation.ts): Kiosk route path constants.

---

### Screen 1: Patient Category Selection (`app/kiosk/pages/kiosk-new-old-selection/`)

The welcome screen where patients indicate whether they are a "New Patient" or "Old / Returning Patient".

- **Route:** `/kiosk/pages/kiosk-new-old-selection`
- **Page File:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/page.tsx)
- **Layout File:** [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/layout.tsx)
- **Components:**
  - [KioskTitle.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/components/KioskTitle.tsx): Main Filipino/English heading.
  - [PatientTypeBanner.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/components/PatientTypeBanner.tsx): Informational instruction callout.
  - [PatientTypeCards.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/components/PatientTypeCards.tsx): Tappable New/Old selection cards.
- **Where to Edit Texts:**
  - [kioskTitleTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/kioskTitleTexts.ts): Heading copy (`KioskTitleTexts`).
  - [patientTypeBannerTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeBannerTexts.ts): Banner instructions (`PatientTypeBannerTexts`).
  - *Note:* Card labels (`Bagong Pasyente`, `Dating Pasyente`) are fetched dynamically from the `patient_category` database table.
- **Where to Edit Styles:**
  - [kioskTitle.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/kioskTitle.ts): Title font size (referencing `kioskTypography.heroTitle`) and alignments (`KioskTitleStyle`).
  - [patientTypeBanner.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeBanner.ts): Banner container, badge styles, and fluid typography (`clamp(28px, 3.2vmin, 44px)`) (`PatientTypeBannerStyle`).
  - [kioskNewOldLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOldLayout.ts): Page layout classes (`KioskNewOldLayoutClasses`) providing a strictly non-scrollable container (`cardsArea`) fitted completely within the viewport, as patient types (New vs Old) are fixed and do not increase.

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
  - *Note:* Service titles (`label_fil`) and English subtitles (`label_en`) are fetched from the `services` database table.
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
  - [categoryCardsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/constants/categoryCardsTexts.ts): Adult / Pedia bilingual labels (`CategoryCardsTexts`).
- **Where to Edit Styles:**
  - [categoryHeader.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/constants/categoryHeader.ts): Heading typography referencing `kioskTypography` and margins (`CategoryHeaderStyle`).
  - [categoryCards.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/constants/categoryCards.ts): Brand red icon styling (`adultIcon`, `pediaIcon`), enlarged fluid clamp icon (`clamp(48px, 5vmin, 70px)`) and arrow sizing, responsive min-height (`clamp(100px, 11vh, 150px)`), word wrapping on titles without clipping (`overflowWrap: "anywhere"`), horizontal card button layout (icon on left, Filipino title, gray divider line, English subtitle in middle, directional arrow on right), touch active border/arrow highlight classes, typography referencing `kioskTypography`, card grid layout with dynamic `m-auto` centering and bottom padding, card styles, and animations (`CategoryCardsStyle`, `CategoryCardsClasses`).
  - [categoryLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/constants/categoryLayout.ts): Page container styles and responsive padding (`CategoryLayoutStyle`, `CategoryLayoutClasses`) providing sticky greetings header and scrollable buttons area with `cardsScrollArea`.

---

### Screen 4: Cubicle Selection (`app/kiosk/pages/kiosk-cubicle-selection/`)

Consultation doctor / room selection step.

- **Route:** `/kiosk/pages/kiosk-cubicle-selection?serviceId=...&type=...&subcategory=...`
- **Page File:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/page.tsx)
- **Layout File:** [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/layout.tsx) (clean pass-through layout)
- **Components:**
  - [CubicleHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/components/CubicleHeader.tsx): Top header prompt.
  - [CubicleCard.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/components/CubicleCard.tsx): Cubicle button that forwards preferred cubicle numbers and `cubicleNum` selection identifier to SMS input.
- **Where to Edit Texts:**
  - [cubicleHeaderTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleHeaderTexts.ts): Header title and subtitle (`CubicleHeaderTexts`).
  - *Note:* Cubicle names are fetched from the database (`cubicle_selector_groups`).
- **Where to Edit Styles:**
  - [cubicleHeader.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleHeader.ts): Header styles and typography referencing `kioskTypography` (`CubicleHeaderStyle`).
  - [cubicleCard.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleCard.ts): Card styles with enlarged responsive minHeight (`clamp(100px, 11vh, 130px)`) and fluid padding, multi-line wrapping for long cubicle names without ellipsis truncation (`whiteSpace: "normal"`, `overflowWrap: "break-word"`), brand red icon with enlarged fluid clamp sizing (`clamp(44px, 4.5vmin, 60px)`), typography referencing `kioskTypography`, touch active border/arrow highlight classes, dynamic `m-auto` centering, and generous bottom padding (`CubicleCardStyle`, `CubicleCardClasses`).
  - [cubicleLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleLayout.ts): Layout wrapper styles (`CubicleLayoutStyle`, `CubicleLayoutClasses`) providing centered prompt and cubicle cards container with `justifyContent: "center"` and `maxHeight: "100%"` ensuring vertical and horizontal centering in both portrait and landscape modes.

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
- **Where to Edit Queue Ticket Prefixes & Rules:**
  - [smsPrefixRules.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsPrefixRules.ts): Service ticket prefix mappings (`SMS_SERVICE_PREFIXES`) and numeric subcategory routing rules (`NUMERIC_PREFIX_RULES`).

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
  - [queuePrintTicketTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/queuePrintTicketTexts.ts): Ticket card labels, metadata prefixes, default destination, and accessible copy (`QueuePrintTicketTexts`).
- **Where to Edit Styles:**
  - [printHeader.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/printHeader.ts): Header typography (`PrintHeaderStyle`).
  - [printFooter.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/printFooter.ts): Footer notice typography (`PrintFooterStyle`).
  - [queuePrintTicket.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/queuePrintTicket.ts): Ticket card dimensions, senior-friendly typography scales without pillboxes, queue callout, dividers, Manila timestamp, cubicle row (`QueuePrintTicketStyle`), and redirect delay (`QUEUE_PRINT_REDIRECT_DELAY_MS`).
  - [queuePrintLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/queuePrintLayout.ts): Print screen layout classes (`QueuePrintLayoutClasses`).

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

7. **Scrolling Architecture Policy (Dynamic Lists vs. Fixed Screens):**
   - **Unified Centered Content Wrapper:** All selection screens ([category-selection](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/page.tsx), [kiosk-services](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/page.tsx), and [kiosk-cubicle-selection](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/page.tsx)) bundle the greetings banner or prompt directly with the button cards inside `contentWrapper` with zero gaps or spaces between greetings and selection buttons.
   - **Fixed Screens (Items Do Not Increase):** Screens with fixed options ([kiosk-new-old-selection](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/layout.tsx), [category-selection](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/page.tsx), [sms-input](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/page.tsx), [queue-print](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/page.tsx)) must be strictly non-scrollable (`overflow-hidden`). All elements and cards must fit comfortably within the available viewport on all screen sizes in both portrait and landscape modes.

8. **Always Center Kiosk UI & Non-Overflow Navigation:**
   Every kiosk screen, whether fixed or scrollable, must ALWAYS center its content both vertically and horizontally in the available viewport.
   - **Non-Overflow Navigation (In-Flow):** The universal back button is rendered in its own dedicated in-flow top navigation row (`topNavWrapper`) in `app/kiosk/layout.tsx`. It is strictly `inline-flex` and never absolute, guaranteeing that no headers, banners, or instruction texts ever share a row or collide with the back button.
   - **Centered Content Area (`<main>`):** All page contents (headers, banners, cards, instructions, numeric keypads) are rendered inside `<main>`, vertically and horizontally centered in the available space between the top navigation bar and the footer wave.
   - **Greetings Directly on Top of Selection Buttons:** On every selection screen, the greetings banner or instruction prompt sits directly on top of the selection cards with zero empty space or gap separating them. No vertical auto-margins (`m-auto`) inside scroll containers may pull or push cards away from the header.
   - **Unified Content Wrapper Centering:** Across [kiosk-services](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/page.tsx), [category-selection](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/page.tsx), and [kiosk-cubicle-selection](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/page.tsx), the container and `contentWrapper` use `m-auto flex flex-col items-center justify-center` so that the greetings prompt and cards are centered cleanly on the page as one block directly between the top navigation back button and the footer.
   - **Fixed Screens Centering:** On fixed screens ([kiosk-new-old-selection](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/layout.tsx), [category-selection](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/page.tsx), [sms-input](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/page.tsx), [queue-print](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/page.tsx)), content is centered vertically and horizontally within the viewport above the kiosk wave footer.

9. **Constant Card Dimensions Standard:**
   All interactive cards (services menu cards, cubicle selector cards, patient category cards) must have strictly constant, uniform sizes across all columns and rows:
   - **Full Grid Fill:** Cards must define `width: "100%"`, `height: "100%"`, and `boxSizing: "border-box"`.
   - **Equal Row Heights:** Grids must enforce `gridAutoRows: "1fr"` and `auto-rows-fr` so that all rows have identical height regardless of variations in text length.
   - **Fixed Icon Alignment:** Icon wrappers must define explicit fixed clamp widths (`width: clamp(...)`, `flexShrink: 0`) so that icons, text labels, and navigation arrows align perfectly across all cards.
