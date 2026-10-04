/**
 * @fileoverview Regulatory footer component for the Staff Login page.
 *
 * Renders security policy disclaimers under Philippine Republic Act No. 10173
 * and internal clinical IT help desk references.
 *
 * @module app/login/components/LoginFooter
 */

'use client';

import React from 'react';
import { LOGIN_TEXTS } from '../constants/loginTexts';
import { LOGIN_STYLES } from '../constants/loginStyles';

/**
 * Staff login regulatory footer component.
 *
 * @returns JSX element.
 */
export function LoginFooter() {
  const S = LOGIN_STYLES.footer;
  const T = LOGIN_TEXTS.footer;

  return (
    <footer className={S.root}>
      <p className={S.text}>{T.securityNotice}</p>
      <p className={S.help}>{T.helpDesk}</p>
    </footer>
  );
}
