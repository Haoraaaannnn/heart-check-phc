/**
 * @fileoverview On-Screen Photo Ticket Fallback Component.
 *
 * Rendered when physical thermal printing is unavailable (out of paper, paper jam,
 * cover open, printer offline, or no printer detected). Provides patients with clear
 * visual instructions to photograph their digital ticket on screen and an immediate
 * finish button. (Phone number entry is already handled on the preceding SMS screen).
 *
 * Architectural & Security Standards:
 * - Strict Separation of Concerns: Copy in `queuePrintTicketTexts.ts`, styles in `queuePrintFallbackStyles.ts`.
 * - Zero Emojis Standard: Replaced with Boxicons (`bx bx-camera`, `bx bx-check-circle`, `bx bx-error-circle`).
 * - Accessible Senior Controls: Large touch button targets without pillboxes.
 *
 * @module app/kiosk/pages/queue-print/components/QueuePrintFallbackCard
 */

'use client';

import { PrinterHardwareCondition } from '@/lib/printer/types';
import { QueuePrintTicketTexts } from '@/app/kiosk/pages/queue-print/constants/queuePrintTicketTexts';
import { QueuePrintFallbackStyles } from '@/app/kiosk/pages/queue-print/constants/queuePrintFallbackStyles';

/** Props for {@link QueuePrintFallbackCard}. */
interface QueuePrintFallbackCardProps {
  /** Detected hardware error condition. */
  condition: PrinterHardwareCondition;
  /** Optional callback triggered when finishing ticket view. */
  onFinish?: () => void;
  /** Live countdown in seconds remaining before automatic redirect. */
  countdownSeconds: number;
}

/**
 * On-screen fallback card offering smartphone photo guidance when physical printing is unavailable.
 *
 * @param props - Component props.
 * @returns The fallback guidance view.
 */
export default function QueuePrintFallbackCard({
  condition,
  onFinish: _onFinish,
  countdownSeconds,
}: QueuePrintFallbackCardProps) {
  const S = QueuePrintFallbackStyles;
  const T = QueuePrintTicketTexts;

  // Resolve bilingual hardware failure rationale
  let reasonFil: string = T.reasonNotDetectedFil;
  let reasonEn: string = T.reasonNotDetectedEn;

  if (condition === 'out_of_paper') {
    reasonFil = T.reasonOutOfPaperFil;
    reasonEn = T.reasonOutOfPaperEn;
  } else if (condition === 'paper_jam') {
    reasonFil = T.reasonPaperJamFil;
    reasonEn = T.reasonPaperJamEn;
  } else if (condition === 'cover_open') {
    reasonFil = T.reasonCoverOpenFil;
    reasonEn = T.reasonCoverOpenEn;
  } else if (condition === 'offline') {
    reasonFil = T.reasonOfflineFil;
    reasonEn = T.reasonOfflineEn;
  }

  return (
    <div style={S.fallbackWrapper}>
      {/* 1. Hardware Status Warning Banner */}
      <div style={S.statusBanner}>
        <i className="bx bx-error-circle" style={S.statusBannerIcon} aria-hidden="true" />
        <div style={S.statusBannerContent}>
          <p style={S.statusBannerTitle}>
            {T.fallbackTitleFil} / {T.fallbackTitleEn}
          </p>
          <p style={S.statusBannerReason}>
            {reasonFil} {reasonEn}
          </p>
        </div>
      </div>

      {/* 2. Photo Guidance Card */}
      <div style={S.photoInstructionCard}>
        <i className="bx bx-camera" style={S.photoIcon} aria-hidden="true" />
        <div style={S.photoTextCol}>
          <p style={S.photoInstructionFil}>{T.photoInstructionFil}</p>
          <p style={S.photoInstructionEn}>{T.photoInstructionEn}</p>
        </div>
      </div>

      {/* 3. Bottom Controls: Auto-Close Timer */}
      <div style={S.bottomControls}>
        <p style={S.countdownNotice}>
          {T.autoClosePrefixFil} {countdownSeconds} {T.autoCloseSuffixFil} (
          {T.autoClosePrefix} {countdownSeconds}s)
        </p>
      </div>
    </div>
  );
}

