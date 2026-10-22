/**
 * @fileoverview Subcomponent for selecting clinical cubicles assigned to medical staff.
 *
 * Groups available consultation and screening cubicles by clinical department,
 * allowing multi-select toggle with checkmark indicators and room badges.
 *
 * @module app/superadmin/components/ClinicalAssignmentsSelector
 */

import React, { useMemo } from 'react';
import { CubicleOption } from '@/app/superadmin/types/superadmin';
import { SUPERADMIN_TEXTS } from '@/app/superadmin/constants/superadminTexts';
import { SUPERADMIN_STYLES } from '@/app/superadmin/constants/superadminStyles';

interface ClinicalAssignmentsSelectorProps {
  /** Full list of configured hospital services. */
  services?: string[];
  /** Array of service names currently assigned. */
  selectedServices?: string[];
  /** Handler to toggle a clinical service selection. */
  onToggleService?: (service: string) => void;
  /** Full list of cubicles fetched from the hospital database. */
  cubicles: CubicleOption[];
  /** Array of cubicle IDs currently selected. */
  selectedCubicleIds: number[];
  /** Toggle handler callback for a specific cubicle ID. */
  onToggleCubicle: (cubicleId: number) => void;
}

/**
 * Renders categorized clinical cubicle and service selection list.
 *
 * @param props - Component properties.
 * @returns JSX element containing the clinical cubicle and service selection panel.
 */
export const ClinicalAssignmentsSelector: React.FC<ClinicalAssignmentsSelectorProps> = ({
  services = [],
  selectedServices = [],
  onToggleService,
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
      {/* 1. Clinical Services Scope */}
      {services.length > 0 && onToggleService && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-bold text-slate-900 dark:text-[#f5f5f5]">
                {T.clinicalServicesTitle}
              </label>
              <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">
                {T.clinicalServicesDesc}
              </p>
            </div>
            <span className="rounded-md bg-rose-100 dark:bg-rose-950 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              {selectedServices.length} {T.clinicalSelectedBadge}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {services.map((service) => {
              const isSelected = selectedServices.includes(service);
              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => onToggleService(service)}
                  className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-[#a8071a]/50 bg-[#a8071a]/10 dark:bg-[#a8071a]/20 text-[#a8071a] dark:text-[#f87171] shadow-xs'
                      : 'border-slate-200 dark:border-[#2e2e2e] bg-white dark:bg-[#1a1a1a] text-slate-700 dark:text-[#a3a3a3] hover:border-[#a8071a]/40 hover:bg-[#a8071a]/5 dark:hover:bg-[#a8071a]/10'
                  }`}
                >
                  <span>{service}</span>
                  {isSelected && (
                    <i
                      className="bx bx-check text-[#a8071a] dark:text-[#f87171] text-base"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Clinical Cubicles Scope */}
      <div className={S.sectionHeader}>
        <div>
          <label className="block text-sm font-bold text-slate-900 dark:text-[#f5f5f5]">
            {T.clinicalSectionTitle}
          </label>
          <p className="text-xs text-slate-500 dark:text-[#a3a3a3] mt-0.5">
            {T.clinicalSectionDesc}
          </p>
        </div>
        <span className="rounded-md bg-rose-100 dark:bg-rose-950 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
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
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition ${
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
