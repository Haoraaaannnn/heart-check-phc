/** @fileoverview Shared browser display settings that are removed before kiosk or monitor pages paint. */
'use client';
import { createContext, useContext, useLayoutEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { allowsDisplayPreferences, type DisplayPreferences } from '@/lib/displayPreferences';
import { getDisplaySnapshot, getDefaultDisplaySnapshot, subscribeDisplayPreferences, updateDisplayPreferences } from '@/lib/displayPreferenceStore';
import { DisplaySettingsButton } from './DisplaySettingsButton';

/** Browser-local settings; these do not mutate account, facility or patient records. */
interface DisplayContextValue {
  preferences: DisplayPreferences;
  storageAvailable: boolean;
  update: (next: DisplayPreferences) => void;
}
const DisplayContext = createContext<DisplayContextValue | null>(null);

/**
 * Applies preferences only to non-public workstation pages, restoring prior styles on exit.
 * @param props - Application children within the theme provider.
 * @returns Shared controls and browser-local persistence without changing kiosk or TV styling.
 */
export function DisplayPreferencesProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const enabled = allowsDisplayPreferences(pathname);
  const { preferences, storageAvailable } = useSyncExternalStore(subscribeDisplayPreferences, getDisplaySnapshot, getDefaultDisplaySnapshot);
  useLayoutEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    const fontSize = root.style.fontSize;
    const zoom = root.style.zoom;
    root.dataset.staffDisplay = 'true';
    root.dataset.staffPageScale = String(preferences.zoomPercent / 100);
    root.style.setProperty('--staff-page-scale', String(preferences.zoomPercent / 100));
    root.style.fontSize = `${preferences.fontPercent}%`;
    root.style.zoom = String(preferences.zoomPercent / 100);
    return () => {
      delete root.dataset.staffDisplay;
      delete root.dataset.staffPageScale;
      root.style.removeProperty('--staff-page-scale');
      root.style.fontSize = fontSize;
      root.style.zoom = zoom;
    };
  }, [enabled, preferences]);
  const hasAccountSettings = /^\/(dashboard|transfer|nurse)(\/|$)/.test(pathname);
  return <DisplayContext.Provider value={{ preferences, storageAvailable, update: updateDisplayPreferences }}>
    {children}
    {enabled && !hasAccountSettings && <DisplaySettingsButton />}
  </DisplayContext.Provider>;
}

/** @returns The current staff display settings within the shared application shell. */
export function useDisplayPreferences(): DisplayContextValue {
  const context = useContext(DisplayContext);
  if (!context) throw new Error('Display settings require the shared application provider.');
  return context;
}
