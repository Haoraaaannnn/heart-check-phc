'use client';

import { useState } from 'react';
import { Patient } from '@/types/Types';
import { transferTexts } from '@/app/transfer/constants/transferTexts';
import { idlePanelStyles } from '@/constants/designs/transferStyles';

/**
 * Props for the IdleNumbersSection component.
 */
type IdleNumbersSectionProps = {
  /** List of idle/skipped patients awaiting reactivation */
  patients: Patient[];
  /** Callback invoked when a patient is reactivated back to the queue */
  onActivate: (patient: Patient) => void;
  /** Callback invoked when a patient is permanently removed/archived */
  onRemove: (patient: Patient) => void;
  /** Whether to render in a compact card layout */
  compact?: boolean;
};

/**
 * IdleNumbersSection renders a collapsible list of idle/skipped queue numbers
 * with high-contrast dark mode badges and action buttons.
 *
 * @param props - Component properties
 * @returns React component
 */
export function IdleNumbersSection({ patients, onActivate, onRemove, compact }: IdleNumbersSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#2e2e2e] rounded-2xl shadow-xs transition-all ${
        compact ? 'p-3' : 'p-4 mb-4'
      }`}
    >
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between gap-2 group cursor-pointer"
        aria-expanded={!collapsed}
      >
        <h2
          className={`text-slate-700 dark:text-[#a3a3a3] font-bold text-xs tracking-wider uppercase flex items-center gap-2 ${
            collapsed ? '' : 'mb-2 pb-1.5 border-b border-slate-200 dark:border-[#2e2e2e]'
          } flex-1 min-w-0`}
        >
          <span className={idlePanelStyles.headerDot} />
          <span className="truncate">{transferTexts.idleNumbersHeading}</span>
          <span className={idlePanelStyles.headerCountBadge}>
            {patients.length}
          </span>
          <span className={idlePanelStyles.headerSubtitle}>
            {transferTexts.idleSubtitle}
          </span>
        </h2>
        <span className="text-xs font-semibold text-slate-500 dark:text-[#737373] group-hover:text-slate-800 dark:group-hover:text-[#f5f5f5] transition-colors shrink-0">
          {collapsed ? transferTexts.show : transferTexts.hide}
        </span>
      </button>

      {!collapsed && (
        patients.length === 0 ? (
          <p className={idlePanelStyles.emptyNotice}>{transferTexts.noIdleNumbers}</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto phc-scroll pr-1 mt-1">
            {patients.map((p) => (
              <div
                key={p.id}
                className={idlePanelStyles.patientRow}
              >
                <div className={idlePanelStyles.patientInfo}>
                  <span className={idlePanelStyles.patientNumBadge}>{p.patientNum}</span>
                  <span className={idlePanelStyles.serviceLabel}>
                    {p.service}
                    {p.subcategory && (
                      <span className={idlePanelStyles.subCategoryLabel}> · {p.subcategory}</span>
                    )}
                  </span>
                  <span className={idlePanelStyles.rotationBadge}>
                    x{p.rotation_count ?? 0}
                  </span>
                </div>
                <div className={idlePanelStyles.actionsWrap}>
                  <button
                    onClick={() => onActivate(p)}
                    className={idlePanelStyles.activateBtn}
                    title={transferTexts.activateBtn}
                  >
                    {transferTexts.activateBtn}
                  </button>
                  <button
                    onClick={() => onRemove(p)}
                    className={idlePanelStyles.removeBtn}
                    title={transferTexts.removeBtn}
                  >
                    {transferTexts.removeBtn}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}