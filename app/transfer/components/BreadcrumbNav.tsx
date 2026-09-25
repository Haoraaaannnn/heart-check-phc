'use client';

import React from 'react';
import { BackButton } from '@/components/reusables/BackButton';
import { transferTexts } from '../constants/transferTexts';

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
    <nav
      className="flex items-center gap-3 w-full select-none min-w-0"
      aria-label="Breadcrumb navigation"
    >
      {canGoBack && (
        <BackButton
          onClick={handleStepBack}
          ariaLabel="Go back one step"
          className="shrink-0"
        />
      )}

      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap phc-scroll py-1 text-sm font-medium">
        {/* Services Root */}
        <button
          type="button"
          onClick={onReset}
          className={`transition-colors cursor-pointer ${
            !selectedCategory
              ? 'text-[#cc3535] font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {transferTexts.servicesCrumb}
        </button>

        {/* Selected Category */}
        {selectedCategory && (
          <>
            <span className="text-slate-300 font-normal">/</span>
            <button
              type="button"
              onClick={onResetToCategory}
              className={`transition-colors cursor-pointer ${
                !selectedSubcategory && !selectedRoom
                  ? 'text-[#cc3535] font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {selectedCategory}
            </button>
          </>
        )}

        {/* Subcategory */}
        {isConsultation && selectedSubcategory && (
          <>
            <span className="text-slate-300 font-normal">/</span>
            <button
              type="button"
              onClick={onResetToSubcategory}
              className={`transition-colors cursor-pointer ${
                !selectedRoom
                  ? 'text-[#cc3535] font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {selectedSubcategory}
            </button>
          </>
        )}

        {/* Room */}
        {selectedRoom && (
          <>
            <span className="text-slate-300 font-normal">/</span>
            <span className="text-[#cc3535] font-bold">
              {transferTexts.roomCrumbPrefix} {selectedRoom}
            </span>
          </>
        )}
      </div>
    </nav>
  );
}

export default BreadcrumbNav;