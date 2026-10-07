/**
 * @fileoverview Header search box component for the Admin Dashboard.
 *
 * Implements real-time workspace search, keyboard navigation (Arrow Up/Down, Enter, Esc),
 * global shortcut listener (Ctrl/Cmd + K), and deep-linking into patient records and
 * administrative services.
 *
 * @module app/dashboard/components/navigation/HeaderSearch
 */

'use client';

import React from 'react';
import { HEADER_SEARCH_TEXTS } from '@/app/dashboard/constants/headerSearchTexts';
import {
  HEADER_SEARCH_STYLES,
  getStatusBadgeClass,
} from '@/app/dashboard/constants/headerSearchStyles';
import {
  useHeaderSearch,
  HeaderSearchResultItem,
} from '@/app/dashboard/hooks/useHeaderSearch';

const S = HEADER_SEARCH_STYLES;
const T = HEADER_SEARCH_TEXTS;

/**
 * Enterprise search input component with live dropdown and command-palette capability.
 *
 * @returns JSX element containing the desktop and mobile search components.
 */
export function HeaderSearch() {
  const {
    query,
    setQuery,
    isOpen,
    setIsOpen,
    isLoading,
    navResults,
    patientResults,
    flatResults,
    selectedIndex,
    setSelectedIndex,
    mobileOpen,
    setMobileOpen,
    inputRef,
    mobileInputRef,
    containerRef,
    handleKeyDown,
    handleSelectResult,
    handleClear,
    handleSubmitQuery,
  } = useHeaderSearch();

  const isQueryActive = query.trim().length > 0;
  const hasNoResults =
    isQueryActive &&
    !isLoading &&
    navResults.length === 0 &&
    patientResults.length === 0;

  return (
    <div className={S.root}>
      {/* 1. Mobile Search Trigger Button (Visible on screens < md) */}
      <button
        type="button"
        onClick={() => {
          setMobileOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        }}
        className={S.mobileTriggerButton}
        title={T.mobile.openSearchAria}
        aria-label={T.mobile.openSearchAria}
      >
        <i className="bx bx-search" aria-hidden="true" />
      </button>

      {/* 2. Desktop Search Input & Floating Dropdown (Visible on md+) */}
      <div ref={containerRef} className={S.desktopContainer}>
        <div className={S.inputWrapper}>
          {isLoading ? (
            <i
              className={`bx bx-loader-alt ${S.spinnerIcon}`}
              aria-hidden="true"
            />
          ) : (
            <i className={`bx bx-search ${S.searchIcon}`} aria-hidden="true" />
          )}

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={T.input.placeholder}
            aria-label={T.input.ariaLabel}
            className={S.input}
          />

          {isQueryActive && (
            <button
              type="button"
              onClick={handleClear}
              className={S.clearButton}
              title={T.input.clearButtonAria}
              aria-label={T.input.clearButtonAria}
            >
              <i className="bx bx-x" aria-hidden="true" />
            </button>
          )}

          {!isQueryActive && (
            <kbd className={S.shortcutBadge}>{T.input.shortcut}</kbd>
          )}
        </div>

        {/* Floating Dropdown Results Panel */}
        {isOpen && (
          <div className={S.dropdown}>
            <div className={S.scrollArea}>
              {/* Category 1: Navigation Pages & Clinical Services */}
              {navResults.length > 0 && (
                <div className={S.groupSection}>
                  <div className={S.groupHeader}>
                    <span>
                      {isQueryActive
                        ? T.categories.quickNavigation
                        : T.categories.quickNavigation}
                    </span>
                    <span className="font-mono text-[9px] text-slate-400">
                      {navResults.length}
                    </span>
                  </div>

                  {navResults.map((item) => {
                    const globalIdx = flatResults.findIndex(
                      (r) => r.id === item.id
                    );
                    const isSelected = selectedIndex === globalIdx;

                    return (
                      <div
                        key={item.id}
                        onClick={() =>
                          handleSelectResult({
                            type: 'nav',
                            id: item.id,
                            navItem: item,
                          })
                        }
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`${S.resultItem} ${
                          isSelected ? S.resultItemActive : S.resultItemIdle
                        }`}
                        role="button"
                        tabIndex={0}
                      >
                        <div
                          className={`${S.itemIconBox} ${
                            isSelected ? S.itemIconBoxActive : ''
                          }`}
                        >
                          <i className={`bx ${item.icon}`} aria-hidden="true" />
                        </div>
                        <div className={S.itemContent}>
                          <div className={S.itemTitleRow}>
                            <span className={S.itemTitle}>{item.title}</span>
                            <span className={S.categoryBadge}>
                              {item.category}
                            </span>
                          </div>
                          <p className={S.itemSubtitle}>{item.subtitle}</p>
                        </div>
                        <i
                          className="bx bx-chevron-right text-slate-400 text-sm"
                          aria-hidden="true"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Category 2: Matching Patient Queue Tickets */}
              {patientResults.length > 0 && (
                <div className={S.groupSection}>
                  <div className={S.groupHeader}>
                    <span>{T.categories.patientsAndTickets}</span>
                    <span className="font-mono text-[9px] text-slate-400">
                      {patientResults.length}
                    </span>
                  </div>

                  {patientResults.map((patient) => {
                    const globalIdx = flatResults.findIndex(
                      (r) => r.id === `pat-${patient.id}`
                    );
                    const isSelected = selectedIndex === globalIdx;

                    return (
                      <div
                        key={patient.id}
                        onClick={() =>
                          handleSelectResult({
                            type: 'patient',
                            id: `pat-${patient.id}`,
                            patientItem: patient,
                          })
                        }
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`${S.resultItem} ${
                          isSelected ? S.resultItemActive : S.resultItemIdle
                        }`}
                        role="button"
                        tabIndex={0}
                      >
                        <div className={S.ticketBadge}>
                          {patient.patientNum || `#${patient.id}`}
                        </div>

                        <div className={S.itemContent}>
                          <div className={S.itemTitleRow}>
                            <span className={S.serviceBadge}>
                              {patient.service}
                            </span>
                            <span
                              className={getStatusBadgeClass(patient.status)}
                            >
                              {patient.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-[#8c8c8c] flex-wrap">
                            <span>
                              {T.items.patientIdPrefix}
                              {patient.id}
                            </span>
                            {patient.waitTime !== undefined &&
                              patient.waitTime !== '--' && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {patient.waitTime} {T.items.waitTimeSuffix}
                                  </span>
                                </>
                              )}
                            {patient.time && (
                              <>
                                <span>•</span>
                                <span>{patient.time}</span>
                              </>
                            )}
                            {patient.phoneNum && (
                              <>
                                <span>•</span>
                                <span>{patient.phoneNum}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <i
                          className="bx bx-right-arrow-alt text-slate-400 text-base"
                          aria-hidden="true"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty Search State */}
              {hasNoResults && (
                <div className={S.emptyContainer}>
                  <i
                    className={`bx bx-search-alt ${S.emptyIcon}`}
                    aria-hidden="true"
                  />
                  <div className={S.emptyTitle}>{T.emptyState.title}</div>
                  <div className={S.emptyDesc}>
                    {T.emptyState.description(query)}
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitQuery}
                    className={S.emptyActionBtn}
                  >
                    <span>{T.emptyState.actionButton}</span>
                    <i className="bx bx-arrow-back rotate-180" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            {/* Dropdown Command Footer */}
            <div className={S.footerBar}>
              <div
                onClick={handleSubmitQuery}
                className="cursor-pointer hover:text-[#a8071a] dark:hover:text-[#f87171] transition"
              >
                {T.footer.pressEnterHint}
              </div>

              <div className={S.footerKbdGroup}>
                <span className="flex items-center gap-1">
                  <kbd className={S.footerKbd}>↑↓</kbd>
                  <span>{T.footer.navigateHint}</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className={S.footerKbd}>↵</kbd>
                  <span>{T.footer.selectHint}</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className={S.footerKbd}>Esc</kbd>
                  <span>{T.footer.closeHint}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Mobile Responsive Modal Overlay (Visible when mobileOpen is true) */}
      {mobileOpen && (
        <div
          className={S.mobileOverlayBackdrop}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className={S.mobileOverlayContainer}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={T.mobile.headerTitle}
          >
            {/* Mobile Header Bar */}
            <div className={S.mobileOverlayHeader}>
              <div className={S.mobileOverlayTitle}>
                {T.mobile.headerTitle}
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className={S.mobileCloseButton}
                aria-label={T.mobile.closeSearchAria}
              >
                <i className="bx bx-x text-2xl" aria-hidden="true" />
              </button>
            </div>

            {/* Mobile Search Input */}
            <div className="p-3 border-b border-slate-200 dark:border-[#2e2e2e]">
              <div className="relative w-full">
                {isLoading ? (
                  <i
                    className={`bx bx-loader-alt ${S.spinnerIcon}`}
                    aria-hidden="true"
                  />
                ) : (
                  <i
                    className={`bx bx-search ${S.searchIcon}`}
                    aria-hidden="true"
                  />
                )}

                <input
                  ref={mobileInputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={T.input.mobilePlaceholder}
                  aria-label={T.input.ariaLabel}
                  className={S.mobileInput}
                />

                {isQueryActive && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className={S.mobileClearButton}
                    aria-label={T.input.clearButtonAria}
                  >
                    <i className="bx bx-x" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Results Scrollable Feed */}
            <div className={S.scrollArea}>
              {/* Category 1: Navigation Pages */}
              {navResults.length > 0 && (
                <div className={S.groupSection}>
                  <div className={S.groupHeader}>
                    <span>{T.categories.quickNavigation}</span>
                    <span className="font-mono text-[9px] text-slate-400">
                      {navResults.length}
                    </span>
                  </div>

                  {navResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        handleSelectResult({
                          type: 'nav',
                          id: item.id,
                          navItem: item,
                        })
                      }
                      className={S.resultItem}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={S.itemIconBox}>
                        <i className={`bx ${item.icon}`} aria-hidden="true" />
                      </div>
                      <div className={S.itemContent}>
                        <div className={S.itemTitleRow}>
                          <span className={S.itemTitle}>{item.title}</span>
                          <span className={S.categoryBadge}>
                            {item.category}
                          </span>
                        </div>
                        <p className={S.itemSubtitle}>{item.subtitle}</p>
                      </div>
                      <i
                        className="bx bx-chevron-right text-slate-400 text-sm"
                        aria-hidden="true"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Category 2: Matching Patients */}
              {patientResults.length > 0 && (
                <div className={S.groupSection}>
                  <div className={S.groupHeader}>
                    <span>{T.categories.patientsAndTickets}</span>
                    <span className="font-mono text-[9px] text-slate-400">
                      {patientResults.length}
                    </span>
                  </div>

                  {patientResults.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() =>
                        handleSelectResult({
                          type: 'patient',
                          id: `pat-${patient.id}`,
                          patientItem: patient,
                        })
                      }
                      className={S.resultItem}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={S.ticketBadge}>
                        {patient.patientNum || `#${patient.id}`}
                      </div>

                      <div className={S.itemContent}>
                        <div className={S.itemTitleRow}>
                          <span className={S.serviceBadge}>
                            {patient.service}
                          </span>
                          <span
                            className={getStatusBadgeClass(patient.status)}
                          >
                            {patient.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-[#8c8c8c] flex-wrap">
                          <span>
                            {T.items.patientIdPrefix}
                            {patient.id}
                          </span>
                          {patient.waitTime !== undefined &&
                            patient.waitTime !== '--' && (
                              <>
                                <span>•</span>
                                <span>
                                  {patient.waitTime} {T.items.waitTimeSuffix}
                                </span>
                              </>
                            )}
                          {patient.time && (
                            <>
                              <span>•</span>
                              <span>{patient.time}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <i
                        className="bx bx-right-arrow-alt text-slate-400 text-base"
                        aria-hidden="true"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Mobile Empty State */}
              {hasNoResults && (
                <div className={S.emptyContainer}>
                  <i
                    className={`bx bx-search-alt ${S.emptyIcon}`}
                    aria-hidden="true"
                  />
                  <div className={S.emptyTitle}>{T.emptyState.title}</div>
                  <div className={S.emptyDesc}>
                    {T.emptyState.description(query)}
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitQuery}
                    className={S.emptyActionBtn}
                  >
                    <span>{T.emptyState.actionButton}</span>
                    <i className="bx bx-arrow-back rotate-180" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Footer Action */}
            <div className="p-3 border-t border-slate-200 dark:border-[#2e2e2e] bg-slate-50 dark:bg-[#1a1a1a]">
              <button
                type="button"
                onClick={handleSubmitQuery}
                className="w-full py-2 px-3 rounded-xl bg-[#a8071a] hover:bg-[#8e0616] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{T.emptyState.actionButton}</span>
                <i className="bx bx-arrow-back rotate-180" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HeaderSearch;