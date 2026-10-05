/**
 * @fileoverview Subcomponent for selecting clinical cubicles assigned to medical staff.
 *
 * Groups available consultation and screening cubicles by clinical department,
 * allowing multi-select toggle with checkmark indicators and room badges.
 *
 * @module app/superadmin/components/ClinicalAssignmentsSelector
 */

import React, { useMemo } from 'react';
import { CubicleOption } from '../types/superadmin';
import { SUPERADMIN_TEXTS } from '../constants/superadminTexts';
import { SUPERADMIN_STYLES } from '../constants/superadminStyles';

interface ClinicalAssignmentsSelectorProps {
  /** Full list of cubicles fetched from the hospital database. */
  cubicles: CubicleOption[];
  /** Array of cubicle IDs currently selected. */
  selectedCubicleIds: number[];
  /** Toggle handler callback for a specific cubicle ID. */
  onToggleCubicle: (cubicleId: number) => void;
}

/**
 * Renders categorized clinical cubicle selection list.
 *
 * @param props - Component properties.
 * @returns JSX element containing the clinical cubicle selection panel.
 */
export const ClinicalAssignmentsSelector: React.FC<ClinicalAssignmentsSelectorProps> = ({
  cubicles,
  selectedCubicleIds,
  onToggleCubicle,
}) => {
  const S = SUPERADMIN_STYLES.modal;
  const T = SUPERADMIN_TEXTS.modal;

  /**
   * Groups cubicles by their parent category name.
   */
  const groupedCubicles = useMemo(() => {
    return cubicles.reduce<Record<string, CubicleOption[]>>((acc, cubicle) => {
      const categoryName = cubicle.category || 'General';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(cubicle);
      return acc;
    }, {});
  }, [cubicles]);

  return (
    <div className={S.assignmentSection}>
      <div className={S.sectionHeader}>
        <div>
          <label className="block text-sm font-bold text-slate-900 dark:text-[#f5f5f5]">
            {T.clinicalSectionTitle}
          </label>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">
            {T.clinicalSectionDesc}
          </p>
        </div>
        <span className="rounded-full bg-rose-100 dark:bg-rose-950 px-3 py-1 text-xs font-semibold text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
          {selectedCubicleIds.length} {T.clinicalSelectedBadge}
        </span>
      </div>

      <div className={S.assignmentScrollBox}>
        {Object.entries(groupedCubicles).map(([category, categoryCubicles]) => (
          <div key={category} className="space-y-2">
            <div className="rounded-md border border-slate-200 dark:border-[#2e2e2e] bg-slate-100 dark:bg-[#242424] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-[#f5f5f5]">
              {category}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categoryCubicles.map((cubicle) => {
                const isSelected = selectedCubicleIds.includes(cubicle.id);

                return (
                  <button
                    key={cubicle.id}
                    type="button"
                    onClick={() => onToggleCubicle(cubicle.id)}
                    className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-[#a8071a] bg-[#a8071a]/10 dark:bg-[#a8071a]/20 text-[#a8071a] dark:text-[#f87171] shadow-xs'
                        : 'border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1f1f1f] text-slate-700 dark:text-[#a3a3a3] hover:border-[#a8071a] hover:bg-[#a8071a]/10 dark:hover:bg-[#a8071a]/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold">{cubicle.cubicleNum}</p>
                        <p
                          className={`mt-0.5 text-xs ${
                            isSelected
                              ? 'text-rose-700 dark:text-rose-300 font-medium'
                              : 'text-slate-500 dark:text-[#a3a3a3]'
                          }`}
                        >
                          {T.clinicalRoomPrefix} {cubicle.room}
                          {cubicle.subcategory ? ` · ${cubicle.subcategory}` : ''}
                        </p>
                      </div>

                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
                          isSelected
                            ? 'border-rose-600 bg-rose-600 text-white'
                            : 'border-slate-300 dark:border-[#2e2e2e] text-transparent'
                        }`}
                      >
                        {isSelected && <i className="bx bx-check text-xs" aria-hidden="true" />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
