/**
 * @fileoverview Barrel re-export for Nurse Dashboard custom hooks.
 *
 * Exposes data fetching, action mutators, drag-and-drop mechanics,
 * tablet selection, real-time sync, and authentication guards.
 */

export * from './dragUtils';
export * from './useNurseDragAndDrop';
export * from './useNurseSelection';
export * from './useNurseData';
export * from './useNurseActions';
export * from './useRequireAuth';
export * from './useRealtimeSubscription';
export * from './useIdleTimeout';
