# Staff Login Developer Guide & Where to Edit Map

This guide documents the architecture, component hierarchy, design tokens, security policies, and editing locations for the Staff Login module (`app/login/page.tsx`).

---

## Architecture Overview

The Staff Login module provides authenticated access for Philippine Heart Center clinical, front-desk, and administrative personnel:
- High-contrast solid surfaces with neutral grayish dark mode (`bg-slate-50 dark:bg-[#0d0d0d]`, `bg-white dark:bg-[#1a1a1a]`)
- Crisp 1-pixel borders (`border-slate-200 dark:border-[#2e2e2e]`)
- Centralized theme surfaces and size tokens defined in [`constants/themeTokens.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/constants/themeTokens.ts) and imported directly
- Dual-theme light/dark mode support with persistent state via `next-themes`
- Synchronized Manila clock display (`Asia/Manila`)
- Security features: Brute-force rate limiting with live countdown timer (HTTP 429), idle session logout detection, Supabase auth handshake, and role-based redirect to `/select-screen`
- Strict separation of concerns per `AGENTS.md`: Zero hardcoded text copy or inline CSS objects in UI component files

---

## File Structure

```
app/login/
├── README.md                              # This developer guide
├── components/
│   ├── LoginHeader.tsx                    # Back to home navigation, brand badge, Manila clock, theme toggle
│   ├── LoginForm.tsx                      # Credential inputs, password reveal toggle, submit CTA, error banners
│   └── LoginFooter.tsx                    # Regulatory compliance notice (RA 10173) and IT help desk link
├── constants/
│   ├── loginTexts.ts                      # Centralized text copy, error messages, and lockout templates
│   └── loginStyles.ts                     # High-contrast solid surface styling tokens and input focus rings
└── page.tsx                               # Page orchestrator managing session and rate-limit states
```

---

## Mandatory "Where to Edit" Reference Map

Use this lookup table to identify the exact file to modify for any change:

| Type of Modification | Target File | Description |
| :--- | :--- | :--- |
| **Centralized surface themes, dark mode colors, or sizing scales** | [`constants/themeTokens.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/constants/themeTokens.ts) | Universal surface, text, border, and size token dictionary |
| **Card headings, form labels, or input placeholders** | [`app/login/constants/loginTexts.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/login/constants/loginTexts.ts) | Modify `LOGIN_TEXTS.card` or `LOGIN_TEXTS.form` properties |
| **Error messages, session expired text, or lockout template** | [`app/login/constants/loginTexts.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/login/constants/loginTexts.ts) | Modify `LOGIN_TEXTS.alerts` properties |
| **Security policy disclaimer or help desk text** | [`app/login/constants/loginTexts.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/login/constants/loginTexts.ts) | Modify `LOGIN_TEXTS.footer` properties |
| **Card background, border tokens, or input focus rings** | [`app/login/constants/loginStyles.ts`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/login/constants/loginStyles.ts) | Modify `LOGIN_STYLES` dictionary tokens |
| **Header navigation, clock display, or theme button** | [`app/login/components/LoginHeader.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/login/components/LoginHeader.tsx) | Header component markup and theme hooks |
| **Form inputs, password reveal button, or alert banners** | [`app/login/components/LoginForm.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/login/components/LoginForm.tsx) | Form subcomponent markup |
| **Legal footer or institutional copyright styling** | [`app/login/components/LoginFooter.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/login/components/LoginFooter.tsx) | Footer component markup |
| **Authentication endpoint, session establishment, or routing** | [`app/login/page.tsx`](file:///home/jensen/Github-Repositories/Heart_Check_PHC/app/login/page.tsx) | Form submission handler and Supabase session logic |
