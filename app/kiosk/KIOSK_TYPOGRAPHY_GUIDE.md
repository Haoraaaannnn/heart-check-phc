# Kiosk Typography & Font Scaling Guide

This guide explains how to safely scale and increase font sizes across the Heart Check PHC Kiosk system without breaking card grids, overflowing containers, or distorting displays in portrait or landscape orientations.

---

## 1. Core Principles of Kiosk Typography

Kiosk displays vary in size, resolution, and mounting orientation (portrait kiosks vs. widescreen landscape displays). To ensure text remains legible without breaking layouts:

1. **Never use static pixels (`px`) for font sizes:** Hardcoding static font sizes causes text to overflow on compact displays or wrap awkwardly.
2. **Always use fluid CSS `clamp()` scales:** All typography must specify minimum, responsive preferred, and maximum bounds:
   ```css
   font-size: clamp(MINIMUM, PREFERRED_VIEWPORT_SCALING, MAXIMUM);
   ```
3. **Keep word wrapping enabled:** Containers and badges must enforce `whiteSpace: "normal"` and `overflowWrap: "break-word"`. Never use `truncate` or text ellipsis (`...`).
4. **Use compact line heights on large headings:** Keep `lineHeight` between `1.15` and `1.25` on headings. A large line height (such as `1.6`) combined with large fonts causes multi-line wrapped text to expand vertically and push buttons off the screen.
5. **Compensate with internal padding:** When increasing font sizes, slightly reduce internal top and bottom padding (`paddingTop`, `paddingBottom`) so the overall button or card bounding box remains constant.

---

## 2. Anatomy of a Fluid Clamp

The CSS `clamp()` function takes three arguments:

```typescript
font-size: clamp(min, preferred, max);
```

| Parameter | Role | Why It Protects the Layout |
| :--- | :--- | :--- |
| **`min`** (e.g. `24px`) | Lower bound | Prevents text from shrinking into illegibility on smaller screens. |
| **`preferred`** (e.g. `2.8vw` or `3.2vmin`) | Responsive scaler | Continuously recalculates size based on viewport width (`vw`) or viewport minimum (`vmin`). |
| **`max`** (e.g. `36px`) | Safety ceiling | Blocks the font from expanding past the card boundaries on ultra-wide screens. |

### Dual Orientation (Portrait & Landscape) Rule

- `vw` measures viewport width. In portrait kiosks, `vw` is narrower than in landscape.
- `vh` measures viewport height. In landscape displays, `vh` is shorter.
- **`vmin`** (minimum of width and height) provides uniform scaling regardless of screen orientation:
  ```typescript
  // Recommended for components shared across portrait and landscape:
  fontSize: "clamp(24px, 3.2vmin, 38px)"
  ```

---

## 3. How to Increase Font Sizes Safely

### Example 1: Global Typography Scale

To increase font sizes across all kiosk screens at once, edit [constants/kiosk.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/constants/kiosk.ts).

Scale all three parameters proportionally:

```typescript
// Location: constants/kiosk.ts -> kioskTypography

// Original Card Title:
cardTitle: "clamp(30px, 3.4vw, 40px)",

// Safe +15% Scale-Up:
cardTitle: "clamp(34px, 3.8vw, 46px)",

// Original Primary Button Text:
buttonText: "clamp(18px, 2vw, 26px)",

// Safe +15% Scale-Up:
buttonText: "clamp(20px, 2.3vw, 30px)",
```

---

### Example 2: Component-Specific Scaling with Padding Compensation

When scaling text inside fixed-height cards or buttons, reduce internal card padding to preserve the outer card dimensions:

```typescript
// Location: app/kiosk/pages/category-selection/constants/categoryCards.ts

export const CategoryCardsStyle = {
    card: {
        // Reduced vertical padding to allow larger text without card growth:
        paddingTop: "clamp(10px, 1.2vh, 16px)",    // was clamp(14px, 1.8vh, 22px)
        paddingBottom: "clamp(10px, 1.2vh, 16px)", // was clamp(14px, 1.8vh, 22px)
        minHeight: "clamp(100px, 11vh, 150px)",
    },
    title: {
        fontSize: "clamp(28px, 3.2vw, 42px)",      // was clamp(24px, 2.8vw, 36px)
        lineHeight: 1.15,
        whiteSpace: "normal",
        overflowWrap: "break-word",
    },
};
```

---

## 4. Where to Edit Typography by Screen

Use this lookup table to locate the exact style file for each screen:

| Screen / Feature | Style File | What to Adjust |
| :--- | :--- | :--- |
| **Global Scale (All Screens)** | [kiosk.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/constants/kiosk.ts) | `kioskTypography` object (`pageTitle`, `cardTitle`, `buttonText`, `instructionPrimary`). |
| **Idle Slideshow Prompt** | [idleRedirect.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/constants/idleRedirect.ts) | `IdleRedirectStyle.tapTitle`, `IdleRedirectStyle.tapSubtitle`, and `IdleRedirectStyle.tapPromptBadge`. |
| **New vs. Old Patient Selection** | [patientTypeCards.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeCards.ts) | `PatientTypeCardsStyle.title`, `PatientTypeCardsStyle.subtitle`, and `PatientTypeCardsStyle.badge`. |
| **Patient Greetings Banner** | [patientTypeBanner.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/pages/kiosk-new-old-selection/constants/patientTypeBanner.ts) | `PatientTypeBannerStyle.title` and `PatientTypeBannerStyle.subtitle`. |
| **Category Selection (Adult/Pedia)** | [categoryCards.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/pages/category-selection/constants/categoryCards.ts) | `CategoryCardsStyle.title` and `CategoryCardsStyle.subtitle`. |
| **Services Menu Selection** | [servicesCards.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/pages/kiosk-services/constants/servicesCards.ts) | `ServicesCardsStyle.title`, `ServicesCardsStyle.subtitle`, and `ServicesCardsStyle.badge`. |
| **Cubicle & Counter Selection** | [cubicleCard.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/pages/kiosk-cubicle-selection/constants/cubicleCard.ts) | `CubicleCardStyle.title` and `CubicleCardStyle.badge`. |
| **On-Screen Numeric Keypad** | [smsNumPad.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/pages/sms-input/constants/smsNumPad.ts) | `SMSNumPadStyle.key` and `SMSNumPadStyle.button`. |
| **Phone Number Display** | [smsPhoneInput.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/pages/sms-input/constants/smsPhoneInput.ts) | `SMSPhoneInputStyle.digits` and `SMSPhoneInputStyle.prefix`. |
| **Queue Ticket Print Screen** | [queuePrintTicket.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/pages/queue-print/constants/queuePrintTicket.ts) | `QueuePrintTicketStyle.queueNumber`, `serviceTitle`, and `notice`. |
| **Kiosk Bottom Bar (Time & Date)** | [kioskHeader.ts](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/kiosk/pages/kiosk-services/constants/kioskHeader.ts) | `KioskHeaderStyle.brandPrimary`, `brandAccent`, `time`, and `date`. |

---

## 5. Verification Checklist After Scaling Fonts

Before committing typography changes, verify the following:

- [ ] All scaled sizes use `clamp(min, preferred, max)` without static `px` numbers.
- [ ] Cards and buttons retain `minHeight` rather than fixed `height`.
- [ ] Text containers include `overflowWrap: "break-word"` and `whiteSpace: "normal"`.
- [ ] No `truncate` or `text-ellipsis` utility classes are applied.
- [ ] The screen content remains centered vertically and horizontally between the top navigation bar and bottom footer.
- [ ] Layout is checked in both Landscape (1920x1080) and Portrait (1080x1920) modes.
