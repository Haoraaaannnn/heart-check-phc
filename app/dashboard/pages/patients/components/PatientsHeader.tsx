/**
 * @fileoverview Header banner component for the Patients dashboard page.
 *
 * Renders the page title, dynamic description based on selected medical service,
 * and displays any query or realtime network errors.
 *
 * @module app/dashboard/pages/patients/components/PatientsHeader
 */

'use client';

import { PATIENTS_STYLES } from '@/app/dashboard/pages/patients/constants/patients';
import { PATIENTS_TEXTS } from '@/app/dashboard/pages/patients/constants/patientsTexts';

interface PatientsHeaderProps {
  /** The selected service name, or null when viewing all services. */
  service: string | null;
  /** Error message to display, if any. */
  error: string | null;
}

/**
 * Top header banner for the Patients dashboard page following dashboard design patterns.
 *
 * @param props - Component properties.
 * @returns JSX element.
 */
export default function PatientsHeader({ service, error }: PatientsHeaderProps) {
  const S = PATIENTS_STYLES.header;
  const T = PATIENTS_TEXTS.header;

  const title = service ?? T.defaultTitle;
  const subtitle = service
    ? `${T.serviceSubtitlePrefix} ${service}`
    : T.defaultSubtitle;

  return (
    <div className={S.root}>
      <div className={S.titleRow}>
        <div>
          <h1 className={S.title}>{title}</h1>
          <p className={S.subtitle}>{subtitle}</p>
        </div>
      </div>
      {error && (
        <div className={S.errorBadge} role="alert">
          <span>{T.errorPrefix}</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
