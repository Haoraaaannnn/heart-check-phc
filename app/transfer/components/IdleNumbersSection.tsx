'use client';
import { Patient } from '@/types/Types';

type IdleNumbersSectionProps = {
  patients: Patient[];
  onActivate: (patient: Patient) => void;
  onRemove: (patient: Patient) => void;
  compact?: boolean;
};

export function IdleNumbersSection({ patients, onActivate, onRemove, compact }: IdleNumbersSectionProps) {
  return (
    <div className={`bg-white border-2 border-gray-200 rounded-3xl shadow-sm ${compact ? 'p-4' : 'p-5 mb-4'}`}>
      <h2 className="text-gray-500 font-semibold text-xs mb-3 tracking-widest uppercase flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
        Idle Numbers ({patients.length})
        <span className="text-xs text-gray-400 font-normal ml-2">
          (Timed out 5+ times)
        </span>
      </h2>

      {patients.length === 0 ? (
        <p className="text-gray-300 text-xs">No idle numbers.</p>
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
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onActivate(p)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-green-50 hover:bg-green-100 text-green-600 transition"
                  title="Activate"
                >
                  <i className="bx bx-play-circle text-sm" />
                </button>
                <button
                  onClick={() => onRemove(p)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-red-50 hover:bg-red-100 text-red-500 transition"
                  title="Remove"
                >
                  <i className="bx bx-trash text-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}