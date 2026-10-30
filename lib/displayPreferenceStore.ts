/** @fileoverview Browser-local display store with a stable server snapshot and cross-tab updates. */
import { DEFAULT_DISPLAY_PREFERENCES, DISPLAY_STORAGE_KEY, parseDisplayPreferences, readDisplayPreferences, type DisplayPreferences } from './displayPreferences';

/** Stable external-store snapshot used during hydration and after browser preference changes. */
interface DisplaySnapshot { preferences: DisplayPreferences; storageAvailable: boolean }
const DEFAULT_SNAPSHOT: DisplaySnapshot = { preferences: DEFAULT_DISPLAY_PREFERENCES, storageAvailable: true };
let snapshot = DEFAULT_SNAPSHOT;
const listeners = new Set<() => void>();

/** @returns The current stable client snapshot without reading storage during React rendering. */
export function getDisplaySnapshot() { return snapshot; }
/** @returns Unscaled defaults for server rendering and hydration. */
export function getDefaultDisplaySnapshot() { return DEFAULT_SNAPSHOT; }

/** @param next - Validated preferences and storage status to publish to the active provider. */
function publish(next: DisplaySnapshot) {
  if (next.preferences.fontPercent === snapshot.preferences.fontPercent && next.preferences.zoomPercent === snapshot.preferences.zoomPercent
    && next.storageAvailable === snapshot.storageAvailable) return;
  snapshot = next;
  listeners.forEach(listener => listener());
}

/** @param onChange - React's external-store subscription; reads storage only when the browser subscribes. */
export function subscribeDisplayPreferences(onChange: () => void) {
  listeners.add(onChange);
  try { publish({ preferences: readDisplayPreferences(window.localStorage.getItem(DISPLAY_STORAGE_KEY)), storageAvailable: true }); }
  catch { publish({ preferences: snapshot.preferences, storageAvailable: false }); }
  /** @param event - Synchronizes only display changes, including a browser storage clear. */
  function synchronize(event: StorageEvent) {
    if (event.key === DISPLAY_STORAGE_KEY || event.key === null) publish({ preferences: readDisplayPreferences(event.newValue), storageAvailable: snapshot.storageAvailable });
  }
  window.addEventListener('storage', synchronize);
  return () => { listeners.delete(onChange); window.removeEventListener('storage', synchronize); };
}

/** @param next - Allowed display choices; unavailable storage never prevents an immediate local adjustment. */
export function updateDisplayPreferences(next: DisplayPreferences) {
  const preferences = parseDisplayPreferences(next);
  let storageAvailable = true;
  try { window.localStorage.setItem(DISPLAY_STORAGE_KEY, JSON.stringify(preferences)); }
  catch { storageAvailable = false; }
  publish({ preferences, storageAvailable });
}
