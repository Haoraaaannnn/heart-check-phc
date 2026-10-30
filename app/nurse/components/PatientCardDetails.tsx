/** @fileoverview Readable ticket, destination, service and elapsed-time presentation for clinical patient cards. */
import type { Patient } from '@/types/Types';
import { nurseTexts } from '@/app/nurse/constants/nurseTexts';
import { ElapsedTimer } from '@/app/nurse/components/ElapsedTimer';
import { NurseDragHandle } from '@/app/nurse/components/NurseDragHandle';

/**
 * Presents operational details without truncating ticket numbers, station labels or services.
 * @param props - Existing patient fields and stage timer configuration.
 * @returns Ticket details and the existing timer and drag handle controls.
 */
export function PatientCardDetails({ patient, startedAt, warnAfterSeconds }: {
  patient: Patient; startedAt?: string | null; warnAfterSeconds: number;
}) {
  return <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2">
      <div className="order-1 min-w-0">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#737373]">{nurseTexts.ticketLabel}</p>
        <span className="block break-words whitespace-normal text-xl font-black text-[#cc3535] tabular-nums tracking-tight leading-tight">
          {patient.patientNum}
        </span>
      </div>
      <div className="order-2 flex items-center gap-2">
        <div className="text-right"><p className="mb-1 text-[10px] font-medium text-slate-400 dark:text-[#737373]">{nurseTexts.elapsedLabel}</p>
          <ElapsedTimer startedAt={startedAt} warnAfterSeconds={warnAfterSeconds} className="shrink-0" /></div>
        <NurseDragHandle title={nurseTexts.dragCardHint} />
      </div>
    <div className="order-3 col-span-2 min-w-0">
      {patient.cubicleNum && <span className="mb-1 inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-[#f5f5f5]">
        <i aria-hidden="true" className="bx bx-door-open shrink-0" /><span className="break-words whitespace-normal">{patient.cubicleNum}</span>
      </span>}
      <p className="text-xs text-slate-500 dark:text-[#a3a3a3] break-words whitespace-normal leading-relaxed">
        {patient.service}{patient.subcategory ? ` · ${patient.subcategory}` : ''}
      </p>
    </div>
  </div>;
}
