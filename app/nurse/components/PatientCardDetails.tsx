/** @fileoverview Readable ticket, destination, service and elapsed-time presentation for clinical patient cards. */
import type { Patient } from '@/types/Types';
import { nurseTexts } from '@/app/nurse/constants/nurseTexts';
import { ElapsedTimer } from '@/app/nurse/components/ElapsedTimer';
import { NurseDragHandle } from '@/app/nurse/components/NurseDragHandle';
import type { NurseStationContext } from '@/app/nurse/lib/stationView';

/**
 * Presents operational details without truncating ticket numbers, station labels or services.
 * @param props - Existing patient fields and stage timer configuration.
 * @returns Ticket details and the existing timer and drag handle controls.
 */
export function PatientCardDetails({ patient, startedAt, warnAfterSeconds, stationContext, readOnly = false }: {
  patient: Patient; startedAt?: string | null; warnAfterSeconds: number; stationContext?: NurseStationContext; readOnly?: boolean;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5">
      <div className="order-1 min-w-0">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-[#737373]">{nurseTexts.ticketLabel}</p>
        <span className="block break-words whitespace-normal text-2xl font-black text-[#cc3535] tabular-nums tracking-tight leading-tight">
          {patient.patientNum}
        </span>
      </div>
      <div className="order-2 flex items-center gap-2.5">
        <div className="text-right">
          <p className="mb-1 text-xs font-medium text-slate-400 dark:text-[#737373]">{nurseTexts.elapsedLabel}</p>
          <ElapsedTimer startedAt={startedAt} warnAfterSeconds={warnAfterSeconds} className="shrink-0 text-sm" />
        </div>
        {!readOnly && <NurseDragHandle title={nurseTexts.dragCardHint} />}
      </div>
      <div className="order-3 col-span-2 min-w-0 space-y-1">
        {patient.cubicleNum && (
          <span className="inline-flex max-w-full items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-[#f5f5f5]">
            <i aria-hidden="true" className="bx bx-door-open shrink-0 text-base" />
            <span className="break-words whitespace-normal">{patient.cubicleNum}</span>
          </span>
        )}
        <p className="break-words whitespace-normal text-sm font-medium text-slate-700 dark:text-[#d4d4d4]">
          {stationContext && <>{nurseTexts.roomPrefix} {stationContext.room}{' · '}</>}
          {nurseTexts.doctorOnDuty} {stationContext ? stationContext.doctorName || nurseTexts.noDoctorAssigned : nurseTexts.checkingDoctor}
        </p>
        <p className="text-sm text-slate-500 dark:text-[#a3a3a3] break-words whitespace-normal leading-relaxed">
          {patient.service}{patient.subcategory ? ` · ${patient.subcategory}` : ''}
        </p>
      </div>
    </div>
  );
}
