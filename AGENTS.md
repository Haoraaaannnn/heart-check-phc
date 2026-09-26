# Antigravity Agent Guidelines & Refactoring Rules

This document outlines the mandatory rules and architectural standards that the agent must strictly follow when working in the Heart Check PHC repository.

---

## Core Rules

### 1. Refactor Code Alongside Comprehensive Documentation
- Every refactored or newly created file must include comprehensive, high-quality documentation.
- **File-level JSDoc:** Explain the file's architectural purpose, role in the overall system, and key dependencies.
- **Symbol-level JSDoc:** Document every component, hook, utility function, prop interface, type definition, and exported constant.
- Explain parameter types (`@param`), return types (`@returns`), exceptions/side effects, and design considerations (`@remarks`).
- Maintain existing comments and historical documentation unless explicitly directed to replace them.

---

### 2. Strict Separation of Concerns (UI, Texts, Styles & Properties)
- **UI component files must only assemble and render:** They should not contain hardcoded text copy, raw styling objects, or ad-hoc configurations.
- **Dedicated Text Files (`<feature>Texts.ts`):**
  - All labels, descriptions, placeholders, button text, modal titles, and error messages must be defined in a dedicated text file within that feature's `constants/` folder.
  - Components must import and consume text from these text files.
- **Dedicated Style & Property Dictionaries (`<feature>.ts`):**
  - All inline style objects (`CSSProperties`), responsive dimension tokens, layout configs, and color maps must be defined in a dedicated constants file (following the pattern of `KioskBanner.ts` / `KioskHeader.ts`).
  - Components consume these via imported style objects (e.g. `style={FeatureStyle.container}`).
- **Modular Component Breakdown:** Large monolithic components must be split into single-responsibility subcomponents (e.g., header, card, action buttons, modals).

---

### 3. Constants Scope: Global vs. Feature-Scoped
- **Global Constants (`/constants/`):**
  - Placed in the project's root `constants/` directory **only** if they are truly reused across multiple disparate domains/features (e.g., `themeColors` in `constants/colors.ts`, typography scale in `constants/kiosk.ts`).
  - Do NOT place domain-specific or feature-specific texts/styles in the root constants.
- **Feature-Scoped Constants (`app/<feature>/constants/` or `app/<area>/<feature>/constants/`):**
  - All constants, texts, and styling configurations specific to a feature, route, or module must live strictly within that feature's own `constants/` folder.

---

### 4. Strict Adherence to User-Provided Reference Images
- When the user provides an image, mockup, wireframe, or screenshot:
  - **Follow the provided image as the definitive source of truth.**
  - **Do NOT create your own design interpretations, alter layout positions, or invent alternate layouts.**
  - Replicate typography, colors, button placement, proportions, and visual hierarchy directly from the provided image.

---

### 5. UI & Presentation Preservation During Refactoring
- **Refactoring must preserve the exact visual appearance and behavior:**
  - When asked to refactor code, clean up architecture, or decouple files, **the agent shall NOT redesign, restyle, or modify any UI presentation or user experience** unless the user explicitly asks for UI changes.
  - The UI output before and after refactoring must remain identical and pixel-faithful.
  - Refactoring focus is strictly on code quality, separation of concerns, modularity, maintainability, type safety, and documentation.

---

### 6. No Emojis in Documentation, Code, or System Files
- Emojis must NEVER be used in documentation files (`.md`), code comments, JSDoc annotations, commit messages, or UI copy.
- All documentation, headings, tables, and lists must use clean, professional, plain-text formatting.

---

### 7. Explicit User Permission Required for Command & File Execution
- The agent may propose and execute terminal commands, package manager operations, git operations, linters, or build validations **ONLY AFTER requesting and receiving explicit permission from the user**.
- The agent must NEVER execute autonomous or unconfirmed terminal commands without prior user consent.
- Always state the exact command to be executed and its purpose before running it.

---

## Agent Pre-Commit / Pre-Completion Checklist

Before completing any refactoring or coding task, verify against these rules:
- [ ] Every changed/created file has full file-level and symbol-level JSDoc comments.
- [ ] No raw text copy or inline style objects remain hardcoded in UI components.
- [ ] Text copy is exported from `<feature>Texts.ts`.
- [ ] Styles and visual properties are exported from `<feature>.ts`.
- [ ] Global constants contain only shared/system-level tokens; local constants remain in their feature directory.
- [ ] If an image reference was provided, the implementation matches the image faithfully.
- [ ] No unintentional visual or layout regressions were introduced during refactoring.
- [ ] No emojis are used anywhere in documentation, code, or comments.
- [ ] All terminal commands and executions received explicit user confirmation prior to running.
