/**
 * ArchaFlow Design System — JS-accessible Color Tokens
 *
 * For charts, dynamic styles, and programmatic color access.
 * CSS custom properties remain the primary styling mechanism.
 */

import { palette, lightTheme, darkTheme, type Theme } from "./tokens"

/* ─── Status Colors (light/dark pairs) ─── */
export const statusColors = {
  success: { light: lightTheme.successText, dark: darkTheme.successText, bgLight: lightTheme.successBg, bgDark: darkTheme.successBg },
  warning: { light: lightTheme.warningText, dark: darkTheme.warningText, bgLight: lightTheme.warningBg, bgDark: darkTheme.warningBg },
  danger:  { light: lightTheme.dangerText,  dark: darkTheme.dangerText,  bgLight: lightTheme.dangerBg,  bgDark: darkTheme.dangerBg },
  info:    { light: lightTheme.infoText,    dark: darkTheme.infoText,    bgLight: lightTheme.infoBg,    bgDark: darkTheme.infoBg },
  brand:   { light: lightTheme.brandDefault,dark: darkTheme.brandDefault,bgLight: lightTheme.brandLight, bgDark: darkTheme.brandLight },
} as const

export type StatusKey = keyof typeof statusColors

/** Get a status color resolved for the current mode */
export function getStatusColor(status: StatusKey, mode: "light" | "dark" = "light") {
  const c = statusColors[status]
  return {
    text: mode === "dark" ? c.dark : c.light,
    bg: mode === "dark" ? c.bgDark : c.bgLight,
  }
}

/* ─── Chart Palette ─── */
/** Ordered color array for Recharts / chart libraries */
export const chartPalette = [
  palette.amber500,   // brand gold
  palette.blue500,    // steel blue
  palette.green500,   // forest green
  palette.red500,     // rust red
  palette.plum500,    // plum
  palette.amber300,   // lighter gold
  palette.blue300,    // lighter blue
  palette.green300,   // lighter green
] as const

/* Re-export palette for convenience */
export { palette }
