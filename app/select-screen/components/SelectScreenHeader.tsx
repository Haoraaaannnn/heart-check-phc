/**
 * @fileoverview Header component for the Screen Display Selector module.
 *
 * Displays the system brand, authenticated staff profile summary, role indicator,
 * and session sign out control.
 *
 * @module app/select-screen/components/SelectScreenHeader
 */

'use client';

import { CurrentStaffProfile } from '../types/selectScreen';
import { SELECT_SCREEN_STYLES } from '../constants/selectScreen';
import { SELECT_SCREEN_TEXTS } from '../constants/selectScreenTexts';

interface SelectScreenHeaderProps {
  /** Authenticated staff profile information. */
  staff: CurrentStaffProfile | null;
  /** Callback triggered to sign out the active staff session. */
  onSignOut: () => void;
}

/**
 * Top navigation and hero banner for the Screen Display Selector.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function SelectScreenHeader({ staff, onSignOut }: SelectScreenHeaderProps) {
  const S = SELECT_SCREEN_STYLES.header;
  const H = SELECT_SCREEN_STYLES.hero;
  const T = SELECT_SCREEN_TEXTS.header;

  return (
    <>
      <nav className={S.nav}>
        <div className={S.brand}>
          {T.brandName} <span className={S.brandAccent}>{T.brandTag}</span>
        </div>

        {staff && (
          <div className={S.userInfo}>
            <span className={S.userText}>
              {T.signedInAs}{' '}
              <strong className="text-gray-900">{staff.username}</strong>
            </span>
            <span className={S.roleBadge}>{staff.role}</span>
            <button
              type="button"
              onClick={onSignOut}
              className={S.signOutBtn}
            >
              {T.signOutButton}
            </button>
          </div>
        )}
      </nav>

      <div className={H.wrapper}>
        <h1 className={H.title}>{T.pageTitle}</h1>
        <p className={H.subtitle}>{T.pageSubtitle}</p>
      </div>
    </>
  );
}
