/**
 * @fileoverview Text constants for connection health banners and offline queue indicators.
 *
 * Adheres strictly to AGENTS.md rules with zero emojis and centralized UI copy.
 *
 * @module constants/connectionTexts
 */

export const connectionTexts = {
  /** Displayed when browser has completely lost network connectivity. */
  noInternet: 'No internet connection. Polling every 5 seconds for updates.',

  /** Displayed when browser is online but Supabase Realtime channel dropped. */
  weakSignal:
    'Weak signal - Real-time paused. Polling every 5 seconds. Queue data may be slightly delayed.',

  /** Displayed when Supabase Realtime WebSocket connection has closed unexpectedly. */
  connectionClosed: 'Connection closed. Reconnecting and polling for updates...',

  /** Displayed briefly upon full reconnection to both internet and Realtime. */
  liveRestored: 'Live - Real-time updates restored.',

  /** Displayed when offline actions are safely stored on disk and waiting for reconnection. */
  offlinePendingPlural: (count: number): string =>
    `Offline - ${count} changes saved locally. Will sync automatically when reconnected.`,

  /** Displayed when a single offline action is safely stored on disk. */
  offlinePendingSingular:
    'Offline - 1 change saved locally. Will sync automatically when reconnected.',

  /** Displayed while background sync engine is actively pushing queued mutations. */
  syncingQueue: (count: number): string =>
    `Syncing ${count} offline changes to server...`,

  /** Displayed briefly after queued mutations are successfully flushed. */
  allChangesSynced: 'All offline changes synced successfully to database.',
};

export default connectionTexts;
