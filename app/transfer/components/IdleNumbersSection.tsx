'use client';
import { useState } from 'react';
import { Patient } from '@/types/Types';
import { transferTexts } from '@/app/transfer/constants/transferTexts';

type IdleNumbersSectionProps = {
  patients: Patient[];
  onActivate: (patient: Patient) => void;
  onRemove: (patient: Patient) => void;
  compact?: boolean;
};

export function IdleNumbersSection({ patients, onActivate, onRemove, compact }: IdleNumbersSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-[#2e2e2e] rounded-3xl shadow-sm transition-all ${compact ? 'p-4' : 'p-5 mb-4'}`}>
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between gap-2 group cursor-pointer"
      >
        <h2 className={`text-gray-500 dark:text-[#a3a3a3] font-semibold text-xs tracking-widest uppercase flex items-center gap-2 ${collapsed ? '' : 'mb-3'}`}>
          <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
          {transferTexts.idleNumbersHeading}
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-200 dark:bg-[#242424] text-gray-600 dark:text-[#a3a3a3] normal-case tracking-normal">
            {patients.length}
          </span>
          <span className="text-xs text-gray-400 dark:text-[#737373] font-normal ml-1">
            {transferTexts.idleSubtitle}
          </span>
        </h2>
        <span className="text-xs font-semibold text-gray-400 dark:text-[#737373] group-hover:text-gray-600 dark:group-hover:text-[#f5f5f5] transition-colors shrink-0">
          {collapsed ? transferTexts.show : transferTexts.hide}
        </span>
      </button>

      {!collapsed && (
        patients.length === 0 ? (
          <p className="text-gray-300 dark:text-[#737373] text-xs">{transferTexts.noIdleNumbers}</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
            {patients.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between border border-gray-100 dark:border-[#2e2e2e] rounded-xl px-3 py-2 bg-gray-50 dark:bg-[#1f1f1f] hover:bg-gray-100 dark:hover:bg-[#242424] transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-600 dark:text-[#f5f5f5] font-bold text-sm">{p.patientNum}</span>
                  <span className="text-gray-400 dark:text-[#a3a3a3] text-xs truncate">
                    {p.service}{p.subcategory && ` · ${p.subcategory}`}
                  </span>
                  <span className="text-gray-300 dark:text-[#737373] text-[10px]">x{p.rotation_count ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onActivate(p)}
                    className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-300 transition cursor-pointer"
                    title={transferTexts.activateBtn}
                  >
                    {transferTexts.activateBtn}
                  </button>
                  <button
                    onClick={() => onRemove(p)}
                    className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 dark:text-red-300 transition cursor-pointer"
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