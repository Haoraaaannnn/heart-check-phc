'use client';
import { useState } from 'react';
import { Patient } from '@/types/Types';
import { transferTexts } from '../constants/transferTexts';

type IdleNumbersSectionProps = {
  patients: Patient[];
  onActivate: (patient: Patient) => void;
  onRemove: (patient: Patient) => void;
  compact?: boolean;
};

export function IdleNumbersSection({ patients, onActivate, onRemove, compact }: IdleNumbersSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`bg-white border-2 border-gray-200 rounded-3xl shadow-sm transition-all ${compact ? 'p-4' : 'p-5 mb-4'}`}>
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between gap-2 group cursor-pointer"
      >
        <h2 className={`text-gray-500 font-semibold text-xs tracking-widest uppercase flex items-center gap-2 ${collapsed ? '' : 'mb-3'}`}>
          <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
          {transferTexts.idleNumbersHeading}
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 normal-case tracking-normal">
            {patients.length}
          </span>
          <span className="text-xs text-gray-400 font-normal ml-1">
            {transferTexts.idleSubtitle}
          </span>
        </h2>
        <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-600 transition-colors shrink-0">
          {collapsed ? transferTexts.show : transferTexts.hide}
        </span>
      </button>

      {!collapsed && (
        patients.length === 0 ? (
          <p className="text-gray-300 text-xs">{transferTexts.noIdleNumbers}</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
            {patients.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between border border-gray-100 rounded-xl px-3 py-2 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-600 font-bold text-sm">{p.patientNum}</span>
                  <span className="text-gray-400 text-xs truncate">
                    {p.service}{p.subcategory && ` · ${p.subcategory}`}
                  </span>
                  <span className="text-gray-300 text-[10px]">x{p.rotation_count ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onActivate(p)}
                    className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-green-50 hover:bg-green-100 text-green-600 transition cursor-pointer"
                    title={transferTexts.activateBtn}
                  >
                    {transferTexts.activateBtn}
                  </button>
                  <button
                    onClick={() => onRemove(p)}
                    className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-500 transition cursor-pointer"
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