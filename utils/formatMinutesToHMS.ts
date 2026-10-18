/**
 * @fileoverview Duration formatting utilities converting minutes to standard HH:MM:SS and HH:MM strings.
 *
 * Conforms to AGENTS.md standards: pure function, zero emojis, robust fallback handling.
 *
 * @module utils/formatMinutesToHMS
 */

/**
 * Converts a duration in minutes (can include a fractional part, e.g. 14.3)
 * into a formal hh:mm:ss string for display.
 *
 * Examples:
 *   formatMinutesToHMS(5)      -> "00:05:00"
 *   formatMinutesToHMS(14.3)   -> "00:14:18"
 *   formatMinutesToHMS(114.75) -> "01:54:45"
 *   formatMinutesToHMS(0)      -> "00:00:00"
 *
 * @param minutes - Duration in minutes.
 * @returns Formatted HH:MM:SS string.
 */
export function formatMinutesToHMS(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.round(minutes * 60);
  const hrs  = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

/**
 * Converts a duration in minutes into a standard hh:mm string when seconds are not available.
 *
 * Examples:
 *   formatMinutesToHM(5)      -> "00:05"
 *   formatMinutesToHM(114.75) -> "01:55"
 *   formatMinutesToHM(0)      -> "00:00"
 *
 * @param minutes - Duration in minutes.
 * @returns Formatted HH:MM string.
 */
export function formatMinutesToHM(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) {
    return "00:00";
  }

  const totalMinutes = Math.round(minutes);
  const hrs  = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${pad(hrs)}:${pad(mins)}`;
}

/**
 * Converts a duration in seconds into a formal hh:mm:ss string for display.
 *
 * Examples:
 *   formatSecondsToHMS(300)     -> "00:05:00"
 *   formatSecondsToHMS(858)     -> "00:14:18"
 *   formatSecondsToHMS(200880)  -> "55:48:00"
 *   formatSecondsToHMS(0)       -> "00:00:00"
 *
 * @param seconds - Duration in seconds.
 * @returns Formatted HH:MM:SS string.
 */
export function formatSecondsToHMS(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
    return '00:00:00';
  }

  const totalSecs = Math.round(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

/**
 * Universal duration formatter that takes any raw duration representation (numeric minutes/seconds,
 * or strings like "3348m", "14587m", "15 min", "14", "--") and converts it into
 * standard HH:MM:SS format without trailing minute suffixes.
 *
 * @param val - Raw string or numeric duration.
 * @returns Standard HH:MM:SS string or '-' if empty/unavailable.
 */
export function formatDurationString(val: string | number | undefined | null): string {
  if (val === null || val === undefined || val === '' || val === '--' || val === '-') {
    return '-';
  }
  if (typeof val === 'number') {
    return formatMinutesToHMS(val);
  }
  const trimmed = String(val).trim();
  // Already in HH:MM:SS or HH:MM format
  if (/^\d+:\d{2}(:\d{2})?$/.test(trimmed)) {
    return trimmed;
  }
  // Matches "3348m", "3348 min", "3348 mins", "3348"
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:m|min|mins)?$/i);
  if (match) {
    const mins = parseFloat(match[1]);
    if (!isNaN(mins)) {
      return formatMinutesToHMS(mins);
    }
  }
  return trimmed;
}