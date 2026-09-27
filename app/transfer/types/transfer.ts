/**
 * @fileoverview Type definitions for the Patient Transfer dashboard (`app/transfer/`).
 *
 * Defines domain models, selection interfaces, and display configuration types
 * used across queue management, station allocation, and tablet interaction flows.
 */

import { Patient } from '@/types/Types';

/**
 * Valid origin sources for a patient undergoing transfer.
 */
export type TransferSourceType = 'queue' | 'cubicle' | 'counter';

/**
 * Representation of an actively selected patient awaiting destination assignment.
 *
 * @remarks
 * Used in Click-to-Select mode as a touch-friendly alternative to pointer drag-and-drop.
 */
export interface SelectedTransferPatient {
  /** The patient record being transferred. */
  patient: Patient;
  /** Origin domain of the patient ('queue', 'cubicle', or 'counter'). */
  sourceType: TransferSourceType;
  /** Origin identifier: cubicle number string if from cubicle, counter number if from counter. */
  sourceId?: string | number;
}

/**
 * Available station view modes for the right column of the ServiceBoard.
 *
 * @remarks
 * Allows tablet and desktop users to switch between cubicles and registration counters
 * without vertical scrolling.
 */
export type StationViewMode = 'cubicles' | 'counters' | 'both';
