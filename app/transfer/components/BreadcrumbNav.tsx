/**
 * @fileoverview Professional breadcrumb navigation with integrated BackButton and horizontal overflow scroll.
 *
 * Adheres strictly to AGENTS.md separation-of-concerns standards by consuming centralized
 * styles from transferStyles.ts.
 *
 * @module app/transfer/components/BreadcrumbNav
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/reusables/BackButton';
import { transferTexts } from '@/constants/texts/transferTexts';
import { breadcrumbStyles } from '@/constants/designs/transferStyles';

/**
 * Props for the `BreadcrumbNav` component.
 */
export interface BreadcrumbNavProps {
  /** Selected main category, e.g. "Consultation". */
  selectedCategory: string | null;
  /** Selected subcategory, e.g. "Adult" or "Pedia". */
  selectedSubcategory: string | null;
  /** Selected room number, e.g. 1 or 2. */
  selectedRoom: number | null;
  /** Whether the current flow is Consultation or OPD Screening. */
  isConsultation: boolean;
  /** Handler to reset back to root services view. */
  onReset: () => void;
  /** Handler to navigate back to category level. */
  onResetToCategory: () => void;
  /** Handler to navigate back to subcategory level. */
  onResetToSubcategory: () => void;
  /** Handler to navigate back one step in history. */
  onBackStep?: () => void;
}

/**
 * Professional breadcrumb navigation with integrated BackButton and horizontal overflow scroll.
 *
 * @param props - State and step change handlers.
 * @returns The rendered breadcrumb bar.
 */
export function BreadcrumbNav({
  selectedCategory,
  selectedSubcategory,
  selectedRoom,
  isConsultation,
  onReset,
  onResetToCategory,
  onResetToSubcategory,
  onBackStep,
}: BreadcrumbNavProps) {
  // Determine if a back action is available
  const canGoBack = Boolean(selectedCategory || selectedSubcategory || selectedRoom);

  const handleStepBack = () => {
    if (onBackStep) {
      onBackStep();
      return;
    }

    if (selectedRoom) {
      onResetToSubcategory();
    } else if (selectedSubcategory) {
      onResetToCategory();
    } else if (selectedCategory) {
      onReset();
    }
  };

  return (
    <nav className={breadcrumbStyles.nav} aria-label="Breadcrumb navigation">
      <Link
        href="/select-screen"
        className={breadcrumbStyles.selectScreenBtn}
        title={transferTexts.selectScreenLabel}
        aria-label={transferTexts.selectScreenAria}
      >
        <i className="bx bx-grid-alt text-sm" aria-hidden="true" />
        <span className="hidden sm:inline">{transferTexts.selectScreenLabel}</span>
      </Link>

      {canGoBack && (
        <BackButton
          onClick={handleStepBack}
          ariaLabel="Go back one step"
          className="shrink-0"
        />
      )}

      <div className={breadcrumbStyles.scrollContainer}>
        {/* Services Root */}
        <button
          type="button"
          onClick={onReset}
          className={
            !selectedCategory
              ? breadcrumbStyles.crumbActive
              : breadcrumbStyles.crumbInactive
          }
        >
          {transferTexts.servicesCrumb}
        </button>

        {/* Selected Category */}
        {selectedCategory && (
          <>
            <span className={breadcrumbStyles.divider}>/</span>
            <button
              type="button"
              onClick={onResetToCategory}
              className={
                !selectedSubcategory && !selectedRoom
                  ? breadcrumbStyles.crumbActive
                  : breadcrumbStyles.crumbInactive
              }
            >
              {selectedCategory}
            </button>
          </>
        )}

        {/* Subcategory */}
        {selectedSubcategory && (
          <>
            <span className={breadcrumbStyles.divider}>/</span>
            <button
              type="button"
              onClick={onResetToSubcategory}
              className={
                !selectedRoom
                  ? breadcrumbStyles.crumbActive
                  : breadcrumbStyles.crumbInactive
              }
            >
              {selectedSubcategory}
            </button>
          </>
        )}

        {/* Room */}
        {selectedRoom && (
          <>
            <span className={breadcrumbStyles.divider}>/</span>
            <span className={breadcrumbStyles.crumbActive}>
              {transferTexts.roomCrumbPrefix} {selectedRoom}
            </span>
          </>
        )}
      </div>
    </nav>
  );
}

export default BreadcrumbNav;