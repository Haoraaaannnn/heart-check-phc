/** @fileoverview Visible removal actions for tickets with four or more completed rotations. */
'use client';
import { useRef, useState } from 'react';
import { Patient } from '@/types/Types';
import { canRemoveRotatedPatient } from '../lib/removeRotatedPatient';

/**
 * Offers removal even when a rotated ticket is further down a counter or cubicle lane.
 * @param props - Active station tickets and acknowledged removal callback.
 * @returns A compact eligible-ticket list, or nothing before the fourth rotation.
 */
export function RotatedTicketsPanel({ patients, onRemove }: {
  patients: Patient[]; onRemove: (patient: Patient) => void | Promise<void>;
}) {
  const [busyPatientId, setBusyPatientId] = useState<number | null>(null);
  const busyRef = useRef(false);
  const eligible = [...new Map(patients.filter(canRemoveRotatedPatient).map(patient => [patient.id, patient])).values()];
  if (eligible.length === 0) return null;
  return <div className="flex max-h-32 shrink-0 flex-wrap items-center gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Rotated 4+ times</span>
    {eligible.map(patient => <div key={patient.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700">
      <span className="break-words text-xs font-semibold text-slate-700 dark:text-slate-200">
        {patient.patientNum} · {patient.rotation_count} rotations
        {' · '}{patient.cubicleNum || (!patient.reg_end && patient.counter ? `Counter ${patient.counter}` : 'On Progress')}
      </span>
      <button type="button" disabled={busyPatientId !== null}
        aria-label={`Remove ${patient.patientNum} from queue`}
        onClick={async () => {
          if (busyRef.current) return;
          busyRef.current = true; setBusyPatientId(patient.id);
          try { await onRemove(patient); }
          finally { busyRef.current = false; setBusyPatientId(null); }
        }}
        className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        {busyPatientId === patient.id ? 'Removing…' : 'Remove from queue'}
      </button>
    </div>)}
  </div>;
}
