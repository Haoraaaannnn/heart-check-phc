import { PatientRecord } from '@/hooks/dashboard/useOverviewData';

const FREEZE_STATUSES = ['completed', 'done', 'served', 'on progress', 'serving', 'consulting'];

export function getPatientWaitTime(patient: PatientRecord, currentTime: Date): number {
  const joined = new Date(patient.created_at).getTime();
  const s = (patient.status || '').toLowerCase().trim();

  const end =
    FREEZE_STATUSES.includes(s) && patient.consult_start
      ? new Date(patient.consult_start).getTime()
      : currentTime.getTime();

  return Math.max(0, Math.floor((end - joined) / 60000));
}

export function calcAvgWaitTime(patients: PatientRecord[], currentTime: Date): string {
  if (patients.length === 0) return '--';
  const total = patients.reduce((acc, p) => acc + getPatientWaitTime(p, currentTime), 0);
  return Math.round(total / patients.length).toString();
}