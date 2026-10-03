/**
 * @fileoverview Header search box component for the Admin Dashboard.
 *
 * Implements keyboard shortcut listener (Ctrl/Cmd + K) for rapid patient, ticket,
 * or service lookup across the administrative workspace.
 *
 * @module app/dashboard/components/navigation/HeaderSearch
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { HEADER_SEARCH } from '@/app/dashboard/constants/content';
import { DASH } from '@/app/dashboard/constants/styles';

const S = DASH.header;

/**
 * Enterprise search input component for the top header bar.
 *
 * @returns JSX element containing the search bar.
 */
export function HeaderSearch() {
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl/Cmd + K focuses the search box (only when search is enabled)
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
        <i className={`bx bx-search ${S.searchIcon}`} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          disabled={!HEADER_SEARCH.enabled}
          placeholder={
            HEADER_SEARCH.enabled
              ? HEADER_SEARCH.placeholder
              : HEADER_SEARCH.disabledPlaceholder
          }
          aria-label="Search patient, ticket number, or service"
          className={S.searchInput}
        />
        {HEADER_SEARCH.enabled && (
          <kbd className={S.searchKbd}>{HEADER_SEARCH.shortcut}</kbd>
        )}
      </div>
    </div>
  );
}

export default HeaderSearch;