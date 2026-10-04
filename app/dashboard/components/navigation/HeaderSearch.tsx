'use client';

import { useEffect, useRef } from 'react';
import { HEADER_SEARCH } from '@/app/dashboard/constants/content';
import { DASH } from '@/app/dashboard/constants/styles';

const S = DASH.header;

/**
 * Header search box (patient / ticket / service).
 *
 * Currently UI-only: HEADER_SEARCH.enabled is false, so the input renders
 * disabled with a "coming soon" placeholder. When it is wired to data, flip
 * the flag in constants/content.ts - the Ctrl/Cmd + K focus shortcut is
 * already in place and activates with it.
 */
export default function HeaderSearch() {
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl/Cmd + K focuses the search box (only when search is enabled).
  useEffect(() => {
    if (!HEADER_SEARCH.enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className={S.searchWrap}>
      <div className={S.searchInner}>
        <i className={`bx bx-search ${S.searchIcon}`} />
        <input
          ref={inputRef}
          type="search"
          disabled={!HEADER_SEARCH.enabled}
          placeholder={
            HEADER_SEARCH.enabled ? HEADER_SEARCH.placeholder : HEADER_SEARCH.disabledPlaceholder
          }
          aria-label="Search patient, ticket number, or service"
          className={S.searchInput}
        />
        {HEADER_SEARCH.enabled && <kbd className={S.searchKbd}>{HEADER_SEARCH.shortcut}</kbd>}
      </div>
    </div>
  );
}