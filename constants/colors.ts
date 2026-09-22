/**
 * Global theme colors as hex strings.
 *
 * Every value must be a full hex color including the leading `#`. The
 * `satisfies` check turns a missing `#` (e.g. "7f0407") into a compile
 * error instead of a silently ignored inline style.
 */
export const themeColors = {
  brightRed: "#fd0e19",
  brandRed: "#7f0407",
  DarkRed: "#0a0000",
} as const satisfies Record<string, `#${string}`>;