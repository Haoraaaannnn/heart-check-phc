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
| **Change text copy, titles, or button labels** | Look for the matching `constants/<component>Texts.ts` in that route. |
| **Change colors, typography, or card padding** | Look for the matching `constants/<component>.ts` in that route. |
| **Change layout dimensions, padding, or orientation behavior** | Look for `constants/<feature>Layout.ts` or the route's `layout.tsx`. |
| **Change navigation flow or routing destinations** | Check the page component (`page.tsx`) or `app/kiosk/hooks/useKioskNavigate.ts`. |
| **Change loading overlay message or animation** | [kioskLoadingOverlayTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLoadingOverlayTexts.ts) / [kioskLoadingOverlay.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLoadingOverlay.ts). |
| **Change the universal back button appearance or label** | [kioskBackButtonTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskBackButtonTexts.ts) / [kioskBackButton.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskBackButton.ts). |
| **Change the hardware ticket print API payload** | [QueuePrintContent.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/components/QueuePrintContent.tsx) and `/api/print-ticket/route.ts`. |
| **Change ticket redirect countdown delay** | [queuePrintTicket.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/queuePrintTicket.ts) (`QUEUE_PRINT_REDIRECT_DELAY_MS`). |
| **Change mobile phone number validation rules** | [KioskPhoneEntry.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/KioskPhoneEntry.tsx). |

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
  - [kioskBackButton.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskBackButton.ts): Back button styles and classes (`KioskBackButtonStyles`, `KioskBackButtonClasses`).
  - [kioskLoadingOverlayTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLoadingOverlayTexts.ts): Default loading spinner status strings (`KioskLoadingOverlayTexts`).
  - [kioskLoadingOverlay.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/constants/kioskLoadingOverlay.ts): Loading overlay styling and backdrop filters (`KioskLoadingOverlayStyles`).
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
  - [kioskTitle.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/kioskTitle.ts): Title font size and alignments (`KioskTitleStyle`).
  - [patientTypeBanner.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeBanner.ts): Banner container and badge styles (`PatientTypeBannerStyle`).
  - [patientTypeCards.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeCards.ts): Card dimensions, active scale animation, icon tile background (`PatientTypeCardStyle`, `PatientTypeCardsClasses`).
  - [kioskNewOldLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-new-old-selection/constants/kioskNewOldLayout.ts): Page layout classes (`KioskNewOldLayoutClasses`).

---

### Screen 2: Services Menu (`app/kiosk/pages/kiosk-services/`)

Presents clinical services (Consultation, OPD Screening, Med Cert, etc.) fetched from the `services` table.

- **Route:** `/kiosk/pages/kiosk-services?type=<new|old>`
- **Page File:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/page.tsx)
- **Layout File:** [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/layout.tsx)
- **Components:**
  - [KioskHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/components/KioskHeader.tsx): Top institutional logo and title header.
  - [KioskBanner.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/components/KioskBanner.tsx): Instructional banner banner above services.
  - [KioskServicesGrid.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/components/KioskServicesGrid.tsx): 2-to-3 column grid of service cards.
  - [ServiceCard.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/components/ServiceCard.tsx): Individual interactive service card.
  - [KioskFooterWave.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/components/KioskFooterWave.tsx): Decorative bottom wave graphic.
- **Where to Edit Texts:**
  - [kioskHeaderTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/constants/kioskHeaderTexts.ts): Header institutional title (`KioskHeaderTexts`).
  - [kioskBannerTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/constants/kioskBannerTexts.ts): Banner instructions (`KioskBannerTexts`).
  - *Note:* Service titles and English pills are fetched from the `services` database table.
- **Where to Edit Styles:**
  - [kioskHeader.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/constants/kioskHeader.ts): Header dimensions, logo sizing, and typography (`KioskHeaderStyle`).
  - [kioskBanner.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/constants/kioskBanner.ts): Banner styling (`KioskBannerStyle`).
  - [kioskServices.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-services/constants/kioskServices.ts): Card styling (`KioskServicesCardStyle`), grid spacing (`KioskServicesGridStyle`), and layout utility classes (`KioskServicesClasses`).

---

### Screen 3: Age Category Selection (`app/kiosk/pages/category-selection/`)

Unified age-bracket selector for services requiring Adult (19+) vs Pedia (18 and below) triage.

- **Route:** `/kiosk/pages/category-selection?serviceId=...&type=...&serviceLabel=...`
- **Page File:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/page.tsx)
- **Where to Edit Texts:**
  - [categoryHeaderTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/constants/categoryHeaderTexts.ts): Header question text (`CategoryHeaderTexts`).
  - [categoryCardsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/constants/categoryCardsTexts.ts): Adult / Pedia labels and CTA button label (`CategoryCardsTexts`).
- **Where to Edit Styles:**
  - [categoryHeader.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/constants/categoryHeader.ts): Heading typography and margins (`CategoryHeaderStyle`).
  - [categoryCards.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/constants/categoryCards.ts): Adult (red) / Pedia (sky) color tokens, card grid layout, card styles, and animations (`CategoryCardsStyle`, `CategoryCardsClasses`).
  - [categoryLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/category-selection/constants/categoryLayout.ts): Page container styles and responsive padding (`CategoryLayoutStyle`, `CategoryLayoutClasses`).

---

### Screen 4: Cubicle Selection (`app/kiosk/pages/kiosk-cubicle-selection/`)

Consultation doctor / room selection step.

- **Route:** `/kiosk/pages/kiosk-cubicle-selection?serviceId=...&type=...&subcategory=...`
- **Page File:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/page.tsx)
- **Layout File:** [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/layout.tsx)
- **Components:**
  - [CubicleHeader.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/components/CubicleHeader.tsx): Top header prompt.
  - [CubicleCard.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/components/CubicleCard.tsx): Cubicle button that maps preferred cubicle numbers.
- **Where to Edit Texts:**
  - [cubicleHeaderTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleHeaderTexts.ts): Header title and subtitle (`CubicleHeaderTexts`).
  - *Note:* Cubicle names are fetched from the database (`cubicle_selector_groups`).
- **Where to Edit Styles:**
  - [cubicleHeader.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleHeader.ts): Header styles (`CubicleHeaderStyle`).
  - [cubicleCard.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleCard.ts): Card styles, icons, color tokens, and hover animations (`CubicleCardStyle`, `CubicleCardClasses`).
  - [cubicleLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleLayout.ts): Layout wrapper classes (`CubicleLayoutClasses`).

---

### Screen 5: SMS Phone Entry (`app/kiosk/pages/sms-input/`)

Keypad screen for entering the patient's Philippine mobile number (`09XX XXX XXXX`) for SMS queue notifications.

- **Route:** `/kiosk/pages/sms-input`
- **Page File:** [page.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/page.tsx)
- **Layout File:** [layout.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/layout.tsx)
- **Components:**
  - [SMSBanner.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/SMSBanner.tsx): Notice reminding patient that phone numbers receive SMS updates.
  - [SMSInstruction.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/SMSInstruction.tsx): Keypad input instructions.
  - [PhoneInput.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/PhoneInput.tsx): Formatted phone number display box.
  - [NumPad.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/NumPad.tsx): On-screen touch keypad (digits 0-9 and backspace).
  - [ContinueButton.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/ContinueButton.tsx): Submit button.
  - [KioskPhoneEntry.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/KioskPhoneEntry.tsx): State orchestration for number input and validation.
- **Where to Edit Texts:**
  - [smsInstructionTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsInstructionTexts.ts): Input title, subtitle, banner message, and placeholder (`SMSInstructionTexts`).
  - [smsContinueButtonTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsContinueButtonTexts.ts): Continue button label (`SMSContinueButtonTexts`).
  - [smsModalTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsModalTexts.ts): Validation alerts and confirmation modal text (`SMSModalTexts`).
- **Where to Edit Styles:**
  - [smsBanner.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsBanner.ts): Banner styling (`SMSBannerStyle`).
  - [smsInstruction.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsInstruction.ts): Instruction header styling (`SMSInstructionStyle`).
  - [smsPhoneInput.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsPhoneInput.ts): Number box border, colors, and typography (`SMSPhoneInputStyle`).
  - [smsNumPad.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsNumPad.ts): Touch keypad button sizing, colors, and active press states (`SMSNumPadStyle`, `SMSNumPadClasses`).
  - [smsContinueButton.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsContinueButton.ts): Primary button styles and disabled states (`SMSContinueButtonStyle`).
  - [smsLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/constants/smsLayout.ts): Keypad screen layout and column wrappers (`SMSLayoutClasses`).

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
  - [ConfirmationModal.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/components/ConfirmationModal.tsx): Final modal dialog.
- **Where to Edit Texts:**
  - [confirmationDescriptionTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationDescriptionTexts.ts): Field labels (Service, Subcategory, Phone Number) (`ConfirmationDescriptionTexts`).
  - [confirmationActionsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationActionsTexts.ts): Confirm and Cancel button labels (`ConfirmationActionsTexts`).
  - [confirmationModalTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationModalTexts.ts): Modal prompt and confirmation buttons (`ConfirmationModalTexts`).
  - [confirmationLayoutTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationLayoutTexts.ts): Confirmation heading instructions (`ConfirmationLayoutTexts`).
- **Where to Edit Styles:**
  - [confirmationBanner.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationBanner.ts): Banner styles (`ConfirmationBannerStyle`).
  - [confirmationDescription.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationDescription.ts): Summary card styles (`ConfirmationDescriptionStyle`).
  - [confirmationActions.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationActions.ts): Action button styles (`ConfirmationActionsStyle`).
  - [confirmationModal.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationModal.ts): Modal overlay and dialog styles (`ConfirmationModalStyle`).
  - [confirmationLayout.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/confirmation/constants/confirmationLayout.ts): Layout wrappers (`ConfirmationLayoutClasses`).

---

### Screen 7: Queue Ticket Printing (`app/kiosk/pages/queue-print/`)

Final completion screen showing the generated queue number, triggering the hardware printer API, and returning to the entrance after a countdown.

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
  - [queuePrintTicketTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/queuePrintTicketTexts.ts): Ticket card label (`QueuePrintTicketTexts`).
- **Where to Edit Styles:**
  - [printHeader.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/printHeader.ts): Header typography (`PrintHeaderStyle`).
  - [printFooter.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/printFooter.ts): Footer notice typography (`PrintFooterStyle`).
  - [queuePrintTicket.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/queue-print/constants/queuePrintTicket.ts): Ticket border, badge, queue number size (`QueuePrintTicketStyle`), and redirect delay (`QUEUE_PRINT_REDIRECT_DELAY_MS`).
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
