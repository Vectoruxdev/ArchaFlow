/**
 * ArchaFlow Design System — Tokens
 * Version: 1.0.0
 *
 * Usage:
 *   import { tokens, theme, cssVars } from './archaflow-tokens'
 *
 * This file exports:
 *   - tokens        Raw primitive and semantic token objects
 *   - lightTheme    Resolved semantic tokens for light mode
 *   - darkTheme     Resolved semantic tokens for dark mode
 *   - getTheme()    Helper that returns the right theme for a given mode
 *   - cssVars()     Converts a theme to CSS custom property strings
 *   - cssVarsString Inline-ready CSS :root block for both themes
 */

/* ══════════════════════════════════════════════════════════════
   1. PRIMITIVE COLOR PALETTE
   Raw color values — never reference these directly in components.
   Use semantic tokens instead.
══════════════════════════════════════════════════════════════ */
export const palette = {
  /* Warm Neutral */
  warmNeutral050: "#F7F4EF",
  warmNeutral100: "#F2EEE8",
  warmNeutral150: "#EAE4DC",
  warmNeutral200: "#E4DDD2",
  warmNeutral300: "#D0C8BC",
  warmNeutral400: "#B0A89E",
  warmNeutral500: "#7A7268",
  warmNeutral600: "#5A5248",
  warmNeutral700: "#3A342C",
  warmNeutral800: "#2A241E",
  warmNeutral900: "#1C1916",
  warmNeutral950: "#111110",
  warmNeutral975: "#0E0E0C",
  warmNeutral990: "#0A0A08",

  /* Amber / Brand */
  amber100: "#F5EBD9",
  amber200: "#EDD5AE",
  amber300: "#E0B050",
  amber400: "#D4873E",
  amber500: "#C8902A",
  amber600: "#8B5E2A",
  amber700: "#6A4418",
  amber800: "#3E2508",

  /* Forest Green */
  green100: "rgba(63,122,82,0.08)",
  green200: "rgba(63,122,82,0.15)",
  green300: "#7AAE7A",
  green400: "#4A8C5C",
  green500: "#3F7A52",
  green600: "#326640",
  green700: "#224428",

  /* Steel Blue */
  blue100: "rgba(42,94,139,0.06)",
  blue200: "rgba(42,94,139,0.15)",
  blue300: "#6A9EC8",
  blue400: "#4A7AAC",
  blue500: "#2A5E8B",
  blue600: "#1E4870",
  blue700: "#122E4E",

  /* Rust Red */
  red100: "rgba(168,64,64,0.06)",
  red200: "rgba(168,64,64,0.14)",
  red300: "#C07070",
  red400: "#B85050",
  red500: "#A84040",
  red600: "#8B3030",
  red700: "#5E1C1C",

  /* Plum */
  plum100: "rgba(122,60,150,0.06)",
  plum200: "rgba(122,60,150,0.14)",
  plum400: "#A060D0",
  plum500: "#7A3C96",

  /* Pure */
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;

/* ══════════════════════════════════════════════════════════════
   2. TYPOGRAPHY PRIMITIVES
══════════════════════════════════════════════════════════════ */
export const typography = {
  /* Font Families */
  fontFamilyDisplay:    "'Cormorant Garamond', 'Georgia', 'Times New Roman', serif",
  fontFamilyBody:       "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  fontFamilyMono:       "'IBM Plex Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  fontFamilyFallback:   "system-ui, sans-serif",

  /* Font Weights */
  weightLight:          300,
  weightRegular:        400,
  weightMedium:         500,
  weightSemibold:       600,
  weightBold:           700,
  weightExtrabold:      800,

  /* Font Sizes (rem-based) */
  size8:   "0.5rem",    /* 8px  — micro label  */
  size9:   "0.5625rem", /* 9px  — tiny label   */
  size10:  "0.625rem",  /* 10px — caption xs   */
  size11:  "0.6875rem", /* 11px — caption sm   */
  size12:  "0.75rem",   /* 12px — caption      */
  size13:  "0.8125rem", /* 13px — body sm      */
  size14:  "0.875rem",  /* 14px — body         */
  size15:  "0.9375rem", /* 15px — body lg      */
  size16:  "1rem",      /* 16px — body xl      */
  size18:  "1.125rem",  /* 18px — heading xs   */
  size20:  "1.25rem",   /* 20px — heading sm   */
  size22:  "1.375rem",  /* 22px — heading md   */
  size24:  "1.5rem",    /* 24px — heading      */
  size28:  "1.75rem",   /* 28px — heading lg   */
  size32:  "2rem",      /* 32px — display sm   */
  size36:  "2.25rem",   /* 36px — display      */
  size40:  "2.5rem",    /* 40px — display lg   */
  size48:  "3rem",      /* 48px — display xl   */

  /* Line Heights */
  lineHeightNone:       1,
  lineHeightTight:      1.1,
  lineHeightSnug:       1.2,
  lineHeightNormal:     1.4,
  lineHeightRelaxed:    1.5,
  lineHeightLoose:      1.75,

  /* Letter Spacing */
  trackingTighter:      "-0.05em",
  trackingTight:        "-0.03em",
  trackingSnug:         "-0.02em",
  trackingNormal:       "0em",
  trackingWide:         "0.02em",
  trackingWider:        "0.05em",
  trackingWidest:       "0.1em",
  trackingUppercase:    "0.15em",
} as const;

/* Named text styles (composite) */
export const textStyles = {
  displayXL:   { fontFamily: typography.fontFamilyDisplay, fontSize: typography.size48, fontWeight: typography.weightBold,     lineHeight: typography.lineHeightTight,   letterSpacing: typography.trackingSnug },
  displayLG:   { fontFamily: typography.fontFamilyDisplay, fontSize: typography.size40, fontWeight: typography.weightBold,     lineHeight: typography.lineHeightTight,   letterSpacing: typography.trackingSnug },
  displayMD:   { fontFamily: typography.fontFamilyDisplay, fontSize: typography.size32, fontWeight: typography.weightBold,     lineHeight: typography.lineHeightTight,   letterSpacing: typography.trackingSnug },
  displaySM:   { fontFamily: typography.fontFamilyDisplay, fontSize: typography.size28, fontWeight: typography.weightBold,     lineHeight: typography.lineHeightSnug,    letterSpacing: typography.trackingTight },
  headingLG:   { fontFamily: typography.fontFamilyDisplay, fontSize: typography.size24, fontWeight: typography.weightBold,     lineHeight: typography.lineHeightSnug,    letterSpacing: typography.trackingTight },
  headingMD:   { fontFamily: typography.fontFamilyDisplay, fontSize: typography.size20, fontWeight: typography.weightBold,     lineHeight: typography.lineHeightSnug,    letterSpacing: typography.trackingTight },
  headingSM:   { fontFamily: typography.fontFamilyDisplay, fontSize: typography.size18, fontWeight: typography.weightSemibold, lineHeight: typography.lineHeightNormal,  letterSpacing: typography.trackingTight },
  bodyLG:      { fontFamily: typography.fontFamilyBody,    fontSize: typography.size16, fontWeight: typography.weightRegular,  lineHeight: typography.lineHeightRelaxed, letterSpacing: typography.trackingNormal },
  bodyMD:      { fontFamily: typography.fontFamilyBody,    fontSize: typography.size14, fontWeight: typography.weightRegular,  lineHeight: typography.lineHeightRelaxed, letterSpacing: typography.trackingNormal },
  bodySM:      { fontFamily: typography.fontFamilyBody,    fontSize: typography.size13, fontWeight: typography.weightRegular,  lineHeight: typography.lineHeightRelaxed, letterSpacing: typography.trackingNormal },
  bodyXS:      { fontFamily: typography.fontFamilyBody,    fontSize: typography.size12, fontWeight: typography.weightRegular,  lineHeight: typography.lineHeightNormal,  letterSpacing: typography.trackingNormal },
  labelLG:     { fontFamily: typography.fontFamilyBody,    fontSize: typography.size13, fontWeight: typography.weightSemibold, lineHeight: typography.lineHeightNormal,  letterSpacing: typography.trackingNormal },
  labelMD:     { fontFamily: typography.fontFamilyBody,    fontSize: typography.size12, fontWeight: typography.weightSemibold, lineHeight: typography.lineHeightNormal,  letterSpacing: typography.trackingNormal },
  labelSM:     { fontFamily: typography.fontFamilyBody,    fontSize: typography.size11, fontWeight: typography.weightSemibold, lineHeight: typography.lineHeightNormal,  letterSpacing: typography.trackingNormal },
  captionMD:   { fontFamily: typography.fontFamilyBody,    fontSize: typography.size12, fontWeight: typography.weightRegular,  lineHeight: typography.lineHeightNormal,  letterSpacing: typography.trackingNormal },
  captionSM:   { fontFamily: typography.fontFamilyBody,    fontSize: typography.size11, fontWeight: typography.weightRegular,  lineHeight: typography.lineHeightNormal,  letterSpacing: typography.trackingNormal },
  overline:    { fontFamily: typography.fontFamilyMono,    fontSize: typography.size10, fontWeight: typography.weightSemibold, lineHeight: typography.lineHeightNormal,  letterSpacing: typography.trackingUppercase, textTransform: "uppercase" as const },
  overlineLG:  { fontFamily: typography.fontFamilyMono,    fontSize: typography.size11, fontWeight: typography.weightMedium,   lineHeight: typography.lineHeightNormal,  letterSpacing: typography.trackingUppercase, textTransform: "uppercase" as const },
  codeInline:  { fontFamily: typography.fontFamilyMono,    fontSize: typography.size12, fontWeight: typography.weightRegular,  lineHeight: typography.lineHeightNormal,  letterSpacing: typography.trackingNormal },
  codeBlock:   { fontFamily: typography.fontFamilyMono,    fontSize: typography.size13, fontWeight: typography.weightRegular,  lineHeight: typography.lineHeightLoose,   letterSpacing: typography.trackingNormal },
} as const;

/* ══════════════════════════════════════════════════════════════
   3. SPACING SCALE
══════════════════════════════════════════════════════════════ */
export const spacing = {
  0:   "0px",
  px:  "1px",
  0.5: "2px",
  1:   "4px",
  1.5: "6px",
  2:   "8px",
  2.5: "10px",
  3:   "12px",
  3.5: "14px",
  4:   "16px",
  5:   "20px",
  6:   "24px",
  7:   "28px",
  8:   "32px",
  9:   "36px",
  10:  "40px",
  11:  "44px",
  12:  "48px",
  14:  "56px",
  16:  "64px",
  18:  "72px",
  20:  "80px",
  24:  "96px",
  28:  "112px",
  32:  "128px",
  36:  "144px",
  40:  "160px",
} as const;

/* Named spacing tokens */
export const space = {
  none:     spacing[0],
  hairline: spacing.px,
  xxs:      spacing[0.5],   /* 2px  */
  xs:       spacing[1],     /* 4px  */
  sm:       spacing[2],     /* 8px  */
  md:       spacing[3],     /* 12px */
  lg:       spacing[4],     /* 16px */
  xl:       spacing[6],     /* 24px */
  "2xl":    spacing[8],     /* 32px */
  "3xl":    spacing[12],    /* 48px */
  "4xl":    spacing[16],    /* 64px */
  "5xl":    spacing[20],    /* 80px */
  /* Component-specific */
  inputPaddingX:   spacing[3],   /* 12px */
  inputPaddingY:   spacing[2],   /* 8px  */
  buttonPaddingX:  spacing[4],   /* 16px — default button */
  buttonPaddingY:  spacing[2],   /* 8px  */
  cardPadding:     spacing[5],   /* 20px */
  cardPaddingLG:   spacing[6],   /* 24px */
  sidebarWidth:    "210px",
  sidebarPaddingX: spacing[2.5], /* 10px */
  pageGutter:      spacing[7],   /* 28px */
  pageGutterMD:    spacing[5],   /* 20px */
  pageGutterSM:    spacing[3.5], /* 14px */
} as const;

/* ══════════════════════════════════════════════════════════════
   4. BORDER RADIUS
══════════════════════════════════════════════════════════════ */
export const radius = {
  none:   "0px",
  xs:     "3px",
  sm:     "4px",
  md:     "6px",
  lg:     "8px",
  xl:     "10px",
  "2xl":  "12px",
  "3xl":  "14px",
  "4xl":  "16px",
  "5xl":  "20px",
  full:   "9999px",
  /* Named component tokens */
  button:       "9px",    /* standard button */
  buttonSM:     "7px",
  input:        "9px",
  inputSM:      "8px",
  card:         "14px",
  cardSM:       "12px",
  cardLG:       "16px",
  modal:        "16px",
  dropdown:     "10px",
  badge:        "20px",   /* pill */
  badgeSquared: "5px",    /* square-ish badge (backlog) */
  avatar:       "9999px",
  tag:          "4px",
  sidebar:      "8px",
  tab:          "7px",
  tooltip:      "7px",
  toast:        "10px",
  row:          "8px",
} as const;

/* ══════════════════════════════════════════════════════════════
   5. BORDER WIDTH
══════════════════════════════════════════════════════════════ */
export const borderWidth = {
  0:        "0px",
  hairline: "0.5px",
  thin:     "1px",
  base:     "1px",
  medium:   "1.5px",
  thick:    "2px",
  xthick:   "3px",
  /* Named */
  default:  "1px",
  focus:    "2px",
  active:   "1.5px",  /* selected state border */
  dashed:   "1.5px",  /* empty state dashed */
} as const;

/* ══════════════════════════════════════════════════════════════
   6. SHADOWS / ELEVATION
══════════════════════════════════════════════════════════════ */
export const shadows = {
  /* Light mode */
  light: {
    none:       "none",
    xs:         "0 1px 2px rgba(0,0,0,0.04)",
    sm:         "0 1px 4px rgba(0,0,0,0.05)",
    md:         "0 2px 8px rgba(0,0,0,0.06)",
    lg:         "0 4px 16px rgba(0,0,0,0.08)",
    xl:         "0 8px 32px rgba(0,0,0,0.10)",
    "2xl":      "0 12px 48px rgba(0,0,0,0.12)",
    "3xl":      "0 24px 80px rgba(0,0,0,0.14)",
    inner:      "inset 0 1px 3px rgba(0,0,0,0.06)",
    /* Component-specific */
    card:       "0 1px 4px rgba(0,0,0,0.03)",
    cardHover:  "0 4px 16px rgba(0,0,0,0.07)",
    dropdown:   "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
    modal:      "0 24px 60px rgba(0,0,0,0.18)",
    window:     "0 24px 80px rgba(0,0,0,0.14), 0 1px 0 rgba(255,255,255,0.8) inset",
    button:     "0 2px 12px rgba(28,25,22,0.20)",
    toast:      "0 8px 32px rgba(0,0,0,0.14)",
    fab:        "0 4px 18px rgba(139,94,42,0.28)",
    fabHover:   "0 6px 28px rgba(139,94,42,0.40)",
  },
  /* Dark mode */
  dark: {
    none:       "none",
    xs:         "0 1px 2px rgba(0,0,0,0.15)",
    sm:         "0 1px 4px rgba(0,0,0,0.20)",
    md:         "0 2px 8px rgba(0,0,0,0.25)",
    lg:         "0 4px 16px rgba(0,0,0,0.30)",
    xl:         "0 8px 32px rgba(0,0,0,0.35)",
    "2xl":      "0 12px 48px rgba(0,0,0,0.40)",
    "3xl":      "0 24px 80px rgba(0,0,0,0.50)",
    inner:      "inset 0 1px 3px rgba(0,0,0,0.30)",
    card:       "0 1px 4px rgba(0,0,0,0.20)",
    cardHover:  "0 4px 16px rgba(0,0,0,0.35)",
    dropdown:   "0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.20)",
    modal:      "0 24px 60px rgba(0,0,0,0.45)",
    window:     "0 24px 80px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.03) inset",
    button:     "0 2px 12px rgba(0,0,0,0.40)",
    toast:      "0 8px 32px rgba(0,0,0,0.40)",
    fab:        "0 4px 18px rgba(200,144,42,0.30)",
    fabHover:   "0 6px 28px rgba(200,144,42,0.45)",
  },
} as const;

/* ══════════════════════════════════════════════════════════════
   7. OPACITY
══════════════════════════════════════════════════════════════ */
export const opacity = {
  0:    0,
  5:    0.05,
  8:    0.08,
  10:   0.10,
  12:   0.12,
  15:   0.15,
  20:   0.20,
  25:   0.25,
  30:   0.30,
  40:   0.40,
  50:   0.50,
  60:   0.60,
  70:   0.70,
  75:   0.75,
  80:   0.80,
  90:   0.90,
  95:   0.95,
  100:  1,
  /* Named */
  disabled:     0.40,
  iconDefault:  0.60,
  iconSubtle:   0.40,
  scrimLight:   0.45,
  scrimDark:    0.60,
  overlayLight: 0.80,
  overlayDark:  0.90,
} as const;

/* ══════════════════════════════════════════════════════════════
   8. Z-INDEX
══════════════════════════════════════════════════════════════ */
export const zIndex = {
  base:         0,
  raised:       10,
  dropdown:     100,
  sticky:       200,
  overlay:      300,
  modal:        400,
  modalBackdrop:398,
  drawer:       500,
  drawerBackdrop:498,
  toast:        600,
  tooltip:      700,
  commandPalette:800,
  debug:        9999,
} as const;

/* ══════════════════════════════════════════════════════════════
   9. BREAKPOINTS
══════════════════════════════════════════════════════════════ */
export const breakpoints = {
  xs:   320,    /* px — small phone */
  sm:   480,    /* px — phone */
  md:   768,    /* px — tablet portrait */
  lg:   1080,   /* px — tablet landscape / small desktop */
  xl:   1280,   /* px — desktop */
  "2xl":1440,   /* px — large desktop */
  "3xl":1920,   /* px — widescreen */
} as const;

export const mediaQueries = {
  xs:    `@media (min-width: 320px)`,
  sm:    `@media (min-width: 480px)`,
  md:    `@media (min-width: 768px)`,
  lg:    `@media (min-width: 1080px)`,
  xl:    `@media (min-width: 1280px)`,
  "2xl": `@media (min-width: 1440px)`,
  maxSm: `@media (max-width: 767px)`,
  maxMd: `@media (max-width: 1079px)`,
} as const;

/* ══════════════════════════════════════════════════════════════
   10. GRID & LAYOUT
══════════════════════════════════════════════════════════════ */
export const grid = {
  columns: {
    xs:   1,
    sm:   2,
    md:   4,
    lg:   8,
    xl:   12,
    "2xl":12,
  },
  gutter: {
    xs:  spacing[3],   /* 12px */
    sm:  spacing[3],   /* 12px */
    md:  spacing[4],   /* 16px */
    lg:  spacing[5],   /* 20px */
    xl:  spacing[6],   /* 24px */
  },
  pageMargin: {
    xs:  spacing[3.5], /* 14px */
    sm:  spacing[3.5], /* 14px */
    md:  spacing[5],   /* 20px */
    lg:  spacing[7],   /* 28px */
    xl:  spacing[7],   /* 28px */
  },
  maxWidth: {
    content: "1520px",
    text:    "720px",
    narrow:  "480px",
  },
  sidebar: {
    collapsed: "60px",
    expanded:  "210px",
  },
} as const;

/* ══════════════════════════════════════════════════════════════
   11. MOTION & ANIMATION
══════════════════════════════════════════════════════════════ */
export const motion = {
  /* Duration */
  duration: {
    instant:   "0ms",
    fastest:   "80ms",
    fast:      "120ms",
    normal:    "200ms",
    slow:      "300ms",
    slower:    "450ms",
    slowest:   "600ms",
    xslow:     "900ms",
    page:      "1200ms",
  },
  /* Easing */
  easing: {
    linear:      "linear",
    ease:        "ease",
    easeIn:      "cubic-bezier(0.4, 0, 1, 1)",
    easeOut:     "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut:   "cubic-bezier(0.4, 0, 0.2, 1)",
    spring:      "cubic-bezier(0.16, 1, 0.3, 1)",   /* snappy spring — primary */
    bounce:      "cubic-bezier(0.34, 1.56, 0.64, 1)",
    anticipate:  "cubic-bezier(0.36, 0, 0.66, -0.56)",
  },
  /* Named transitions */
  transition: {
    colors:     "color 150ms ease, background-color 150ms ease, border-color 150ms ease",
    opacity:    "opacity 150ms ease",
    shadow:     "box-shadow 200ms ease",
    transform:  "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
    all:        "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
    theme:      "background 300ms ease, color 300ms ease, border-color 300ms ease",
    slideDown:  "opacity 150ms ease, transform 150ms ease",
    slideUp:    "opacity 200ms ease, transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
    expand:     "height 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease",
    progress:   "width 900ms cubic-bezier(0.16, 1, 0.3, 1)",
    number:     "all 1200ms cubic-bezier(0, 0, 0.2, 1)",
  },
  /* Keyframe definitions (as CSS strings) */
  keyframes: {
    dropIn:   `@keyframes af-drop   { from { opacity:0; transform:translateY(-6px);            } to { opacity:1; transform:translateY(0);   } }`,
    fadeIn:   `@keyframes af-fade   { from { opacity:0;                                        } to { opacity:1;                            } }`,
    slideUp:  `@keyframes af-slideUp{ from { opacity:0; transform:translateY(12px);            } to { opacity:1; transform:translateY(0);   } }`,
    scaleIn:  `@keyframes af-scale  { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1)  translateY(0); } }`,
    toast:    `@keyframes af-toast  { from { opacity:0; transform:translateX(-50%) translateY(12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`,
    spin:     `@keyframes af-spin   { from { transform:rotate(0deg);   } to { transform:rotate(360deg); } }`,
    pulse:    `@keyframes af-pulse  { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`,
    skeleton: `@keyframes af-skel   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }`,
  },
} as const;

/* ══════════════════════════════════════════════════════════════
   12. ICONOGRAPHY
══════════════════════════════════════════════════════════════ */
export const iconography = {
  library:     "Custom inline SVG — outline style",
  style:       "outline",
  strokeWidth: {
    thin:    1.2,
    default: 1.5,
    medium:  1.7,
    bold:    2.0,
  },
  sizes: {
    xs:  10,   /* px — micro inline */
    sm:  12,   /* px — badge / small inline */
    md:  14,   /* px — default inline */
    base:16,   /* px — standard UI icon */
    lg:  18,   /* px — card/stat icon */
    xl:  20,   /* px — section icon */
    "2xl":24,  /* px — large icon */
    "3xl":32,  /* px — feature icon */
  },
  /* Optical alignment — add slight top offset for inline icons */
  verticalAlign:   "middle",
  displayDefault:  "flex",
  flexShrink:      0,
} as const;

/* ══════════════════════════════════════════════════════════════
   SEMANTIC THEMES
   Light and dark resolved token sets for use in components.
══════════════════════════════════════════════════════════════ */

export interface Theme {
  mode: "light" | "dark";

  /* Backgrounds */
  bgCanvas:      string;
  bgOuter:       string;
  bgSurface:     string;
  bgSurfaceAlt:  string;
  bgSurfaceHover:string;
  bgInput:       string;
  bgSidebar:     string;
  bgSidebarSurface:string;
  bgOverlay:     string;
  bgScrim:       string;

  /* Text */
  textPrimary:   string;
  textSecondary: string;
  textMuted:     string;
  textDisabled:  string;
  textInverse:   string;
  textLink:      string;
  textBrand:     string;

  /* Borders */
  borderDefault: string;
  borderStrong:  string;
  borderFocus:   string;
  borderBrand:   string;
  borderSidebar: string;

  /* Brand / Accent */
  brandDefault:  string;
  brandLight:    string;
  brandBorder:   string;
  brandText:     string;

  /* Status: Success */
  successText:   string;
  successBg:     string;
  successBorder: string;

  /* Status: Warning */
  warningText:   string;
  warningBg:     string;
  warningBorder: string;

  /* Status: Danger */
  dangerText:    string;
  dangerBg:      string;
  dangerBorder:  string;

  /* Status: Info */
  infoText:      string;
  infoBg:        string;
  infoBorder:    string;

  /* Status: Neutral (e.g. backlog badge) */
  neutralBadgeBg:  string;
  neutralBadgeText:string;

  /* Interactive */
  interactivePrimary:       string;
  interactivePrimaryText:   string;
  interactivePrimaryHover:  string;
  interactiveSecondary:     string;
  interactiveSecondaryText: string;
  interactiveDestructive:   string;
  interactiveDestructiveText:string;

  /* Sidebar specific */
  sidebarText:    string;
  sidebarMuted:   string;
  sidebarActive:  string;
  sidebarActiveBg:string;

  /* Shadows */
  shadowCard:    string;
  shadowCardHover:string;
  shadowDropdown:string;
  shadowModal:   string;
  shadowWindow:  string;

  /* Scrollbar */
  scrollThumb:   string;
}

export const lightTheme: Theme = {
  mode: "light",

  /* Backgrounds */
  bgCanvas:         palette.warmNeutral050,  /* #F7F4EF */
  bgOuter:          "#E8E3DB",
  bgSurface:        palette.white,
  bgSurfaceAlt:     palette.warmNeutral100,  /* #F2EEE8 */
  bgSurfaceHover:   "#FDFAF5",
  bgInput:          palette.warmNeutral050,
  bgSidebar:        palette.warmNeutral900,  /* #1C1916 dark sidebar */
  bgSidebarSurface: "#262220",
  bgOverlay:        "rgba(255,255,255,0.90)",
  bgScrim:          "rgba(0,0,0,0.45)",

  /* Text */
  textPrimary:   palette.warmNeutral900,  /* #1C1916 */
  textSecondary: palette.warmNeutral500,  /* #7A7268 */
  textMuted:     palette.warmNeutral400,  /* #B0A89E */
  textDisabled:  palette.warmNeutral300,
  textInverse:   "#F0EAD6",
  textLink:      palette.amber600,
  textBrand:     palette.amber600,

  /* Borders */
  borderDefault: palette.warmNeutral200,  /* #E4DDD2 */
  borderStrong:  palette.warmNeutral300,  /* #D0C8BC */
  borderFocus:   palette.amber600,
  borderBrand:   "rgba(139,94,42,0.25)",
  borderSidebar: "#2E2A26",

  /* Brand */
  brandDefault:  palette.amber600,        /* #8B5E2A */
  brandLight:    palette.amber100,        /* #F5EBD9 */
  brandBorder:   "rgba(139,94,42,0.25)",
  brandText:     palette.amber600,

  /* Success */
  successText:   palette.green500,
  successBg:     palette.green100,
  successBorder: "rgba(63,122,82,0.25)",

  /* Warning */
  warningText:   "#B07800",
  warningBg:     "#FFF5DC",
  warningBorder: "rgba(176,120,0,0.25)",

  /* Danger */
  dangerText:    palette.red500,
  dangerBg:      palette.red100,
  dangerBorder:  "rgba(168,64,64,0.22)",

  /* Info */
  infoText:      palette.blue500,
  infoBg:        palette.blue100,
  infoBorder:    "rgba(42,94,139,0.20)",

  /* Neutral badge */
  neutralBadgeBg:   palette.warmNeutral900,
  neutralBadgeText: "#FFFFFF",

  /* Interactive */
  interactivePrimary:        palette.warmNeutral900, /* dark button on light bg */
  interactivePrimaryText:    "#F0EAD6",
  interactivePrimaryHover:   "#2E2A26",
  interactiveSecondary:      palette.white,
  interactiveSecondaryText:  palette.warmNeutral500,
  interactiveDestructive:    palette.red500,
  interactiveDestructiveText:"#FFFFFF",

  /* Sidebar */
  sidebarText:     "#C8C0B4",
  sidebarMuted:    "#5A5248",
  sidebarActive:   "#C8902A",
  sidebarActiveBg: "rgba(200,144,42,0.15)",

  /* Shadows */
  shadowCard:      shadows.light.card,
  shadowCardHover: shadows.light.cardHover,
  shadowDropdown:  shadows.light.dropdown,
  shadowModal:     shadows.light.modal,
  shadowWindow:    shadows.light.window,

  /* Scrollbar */
  scrollThumb: "#D8D0C4",
};

export const darkTheme: Theme = {
  mode: "dark",

  /* Backgrounds */
  bgCanvas:         palette.warmNeutral950,  /* #111110 */
  bgOuter:          palette.warmNeutral990,  /* #0A0A08 */
  bgSurface:        "#141412",
  bgSurfaceAlt:     "#1C1C18",
  bgSurfaceHover:   "#1C1C18",
  bgInput:          palette.warmNeutral975,  /* #0E0E0C */
  bgSidebar:        palette.warmNeutral975,  /* #0E0E0C */
  bgSidebarSurface: "#1A1A16",
  bgOverlay:        "rgba(20,20,18,0.92)",
  bgScrim:          "rgba(0,0,0,0.65)",

  /* Text */
  textPrimary:   "#F0EAD6",
  textSecondary: "#9A9088",
  textMuted:     "#5A5450",
  textDisabled:  "#3A3430",
  textInverse:   palette.warmNeutral900,
  textLink:      palette.amber500,
  textBrand:     palette.amber500,

  /* Borders */
  borderDefault: "#2A2A26",
  borderStrong:  "#3A3A30",
  borderFocus:   palette.amber500,
  borderBrand:   "rgba(200,144,42,0.30)",
  borderSidebar: "#222220",

  /* Brand */
  brandDefault:  palette.amber500,  /* #C8902A */
  brandLight:    "rgba(200,144,42,0.12)",
  brandBorder:   "rgba(200,144,42,0.30)",
  brandText:     palette.amber500,

  /* Success */
  successText:   palette.green300,  /* #7AAE7A */
  successBg:     "rgba(122,174,122,0.10)",
  successBorder: "rgba(122,174,122,0.25)",

  /* Warning */
  warningText:   "#D4A830",
  warningBg:     "rgba(200,160,30,0.12)",
  warningBorder: "rgba(200,160,30,0.25)",

  /* Danger */
  dangerText:    palette.red300,    /* #C07070 */
  dangerBg:      "rgba(192,112,112,0.10)",
  dangerBorder:  "rgba(192,112,112,0.22)",

  /* Info */
  infoText:      palette.blue300,   /* #6A9EC8 */
  infoBg:        "rgba(106,158,200,0.08)",
  infoBorder:    "rgba(106,158,200,0.20)",

  /* Neutral badge */
  neutralBadgeBg:   "#F0EAD6",
  neutralBadgeText: "#111110",

  /* Interactive */
  interactivePrimary:        palette.amber500,  /* amber button on dark bg */
  interactivePrimaryText:    "#0E0E0C",
  interactivePrimaryHover:   palette.amber300,
  interactiveSecondary:      "#1C1C18",
  interactiveSecondaryText:  "#9A9088",
  interactiveDestructive:    palette.red300,
  interactiveDestructiveText:"#111110",

  /* Sidebar */
  sidebarText:     "#C8C0B4",
  sidebarMuted:    "#5A5248",
  sidebarActive:   "#C8902A",
  sidebarActiveBg: "rgba(200,144,42,0.15)",

  /* Shadows */
  shadowCard:      shadows.dark.card,
  shadowCardHover: shadows.dark.cardHover,
  shadowDropdown:  shadows.dark.dropdown,
  shadowModal:     shadows.dark.modal,
  shadowWindow:    shadows.dark.window,

  /* Scrollbar */
  scrollThumb: "#2A2A24",
};

/* ══════════════════════════════════════════════════════════════
   THEME HELPERS
══════════════════════════════════════════════════════════════ */

/** Return the correct theme object for a given preference */
export function getTheme(
  pref: "light" | "dark" | "system",
  systemIsDark = false
): Theme {
  if (pref === "light") return lightTheme;
  if (pref === "dark")  return darkTheme;
  return systemIsDark ? darkTheme : lightTheme;
}

/** Convert a Theme to CSS custom property declarations */
export function themeToCSS(theme: Theme): string {
  const prefix = "--af";
  const entries: string[] = [];
  for (const [key, value] of Object.entries(theme)) {
    if (key === "mode") continue;
    // camelCase → kebab-case
    const prop = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    entries.push(`  ${prefix}-${prop}: ${value};`);
  }
  return entries.join("\n");
}

/** Full CSS string with :root (light) and .af-dark / prefers-color-scheme overrides */
export const cssVarsString = `
/* ArchaFlow Design System — CSS Custom Properties */

:root {
  /* Generated from lightTheme */
${themeToCSS(lightTheme)}

  /* Typography */
  --af-font-display:   ${typography.fontFamilyDisplay};
  --af-font-body:      ${typography.fontFamilyBody};
  --af-font-mono:      ${typography.fontFamilyMono};

  /* Spacing */
  --af-space-xs:  ${space.xs};
  --af-space-sm:  ${space.sm};
  --af-space-md:  ${space.md};
  --af-space-lg:  ${space.lg};
  --af-space-xl:  ${space.xl};
  --af-space-2xl: ${space["2xl"]};

  /* Radius */
  --af-radius-card:    ${radius.card};
  --af-radius-button:  ${radius.button};
  --af-radius-input:   ${radius.input};
  --af-radius-modal:   ${radius.modal};
  --af-radius-badge:   ${radius.badge};
  --af-radius-dropdown:${radius.dropdown};

  /* Motion */
  --af-duration-fast:   ${motion.duration.fast};
  --af-duration-normal: ${motion.duration.normal};
  --af-duration-slow:   ${motion.duration.slow};
  --af-spring:          ${motion.easing.spring};
}

/* Dark mode override — apply .af-dark class to root or use media query */
.af-dark {
${themeToCSS(darkTheme)}
}

@media (prefers-color-scheme: dark) {
  :root:not(.af-light) {
${themeToCSS(darkTheme)}
  }
}
`;

/* ══════════════════════════════════════════════════════════════
   COMPONENT STYLE RECIPES
   Ready-to-compose style objects for common components.
   Reference T (a Theme) at call site.
══════════════════════════════════════════════════════════════ */
export function componentStyles(T: Theme) {
  return {
    /* ─── Button variants ─── */
    button: {
      primary: {
        padding: `${space.inputPaddingY} ${space.buttonPaddingX}`,
        borderRadius: radius.button,
        border: "none",
        background: T.interactivePrimary,
        color: T.interactivePrimaryText,
        fontSize: typography.size13,
        fontWeight: typography.weightSemibold,
        fontFamily: typography.fontFamilyBody,
        cursor: "pointer",
        transition: motion.transition.colors,
        lineHeight: typography.lineHeightNormal,
      },
      secondary: {
        padding: `${space.inputPaddingY} ${space.buttonPaddingX}`,
        borderRadius: radius.button,
        border: `${borderWidth.default} solid ${T.borderDefault}`,
        background: T.bgSurface,
        color: T.textSecondary,
        fontSize: typography.size13,
        fontWeight: typography.weightMedium,
        fontFamily: typography.fontFamilyBody,
        cursor: "pointer",
        transition: motion.transition.all,
        boxShadow: T.shadowCard,
      },
      destructive: {
        padding: `${space.inputPaddingY} ${space.buttonPaddingX}`,
        borderRadius: radius.button,
        border: "none",
        background: T.dangerBg,
        color: T.dangerText,
        fontSize: typography.size13,
        fontWeight: typography.weightSemibold,
        fontFamily: typography.fontFamilyBody,
        cursor: "pointer",
        transition: motion.transition.colors,
      },
      ghost: {
        padding: `${space.inputPaddingY} ${space.buttonPaddingX}`,
        borderRadius: radius.button,
        border: `${borderWidth.default} solid transparent`,
        background: "transparent",
        color: T.textSecondary,
        fontSize: typography.size13,
        fontWeight: typography.weightMedium,
        fontFamily: typography.fontFamilyBody,
        cursor: "pointer",
        transition: motion.transition.all,
      },
    },

    /* ─── Input ─── */
    input: {
      base: {
        width: "100%",
        padding: `${space.inputPaddingY} ${space.inputPaddingX}`,
        borderRadius: radius.input,
        border: `${borderWidth.default} solid ${T.borderDefault}`,
        background: T.bgInput,
        color: T.textPrimary,
        fontSize: typography.size13,
        fontFamily: typography.fontFamilyBody,
        lineHeight: typography.lineHeightNormal,
        outline: "none",
        transition: motion.transition.colors,
      },
      placeholder: { color: T.textMuted },
      focus:  { borderColor: T.borderFocus },
      error:  { borderColor: T.dangerText },
    },

    /* ─── Card ─── */
    card: {
      base: {
        background: T.bgSurface,
        border: `${borderWidth.default} solid ${T.borderDefault}`,
        borderRadius: radius.card,
        padding: space.cardPadding,
        boxShadow: T.shadowCard,
        transition: `${motion.transition.shadow}, ${motion.transition.colors}`,
      },
      hover: {
        boxShadow: T.shadowCardHover,
        borderColor: T.borderStrong,
      },
    },

    /* ─── Dropdown / Menu ─── */
    dropdown: {
      container: {
        position: "absolute" as const,
        background: T.bgSurface,
        border: `${borderWidth.default} solid ${T.borderDefault}`,
        borderRadius: radius.dropdown,
        padding: space.xs,
        zIndex: zIndex.dropdown,
        boxShadow: T.shadowDropdown,
        animation: `af-drop ${motion.duration.fast} ${motion.easing.easeOut}`,
      },
      item: {
        display: "flex",
        alignItems: "center",
        gap: space.sm,
        width: "100%",
        padding: `${space.sm} ${space.md}`,
        borderRadius: radius.row,
        border: "none",
        background: "transparent",
        color: T.textPrimary,
        fontSize: typography.size13,
        fontFamily: typography.fontFamilyBody,
        cursor: "pointer",
        textAlign: "left" as const,
        transition: motion.transition.colors,
      },
      itemHover: { background: T.bgSurfaceAlt },
      itemActive: { background: T.bgSurfaceAlt },
      divider: {
        height: borderWidth.default,
        background: T.borderDefault,
        margin: `${space.xs} ${space.xs}`,
      },
    },

    /* ─── Modal ─── */
    modal: {
      backdrop: {
        position: "fixed" as const,
        inset: 0,
        background: T.bgScrim,
        zIndex: zIndex.modalBackdrop,
        backdropFilter: "blur(3px)",
      },
      container: {
        background: T.bgSurface,
        borderRadius: radius.modal,
        border: `${borderWidth.default} solid ${T.borderDefault}`,
        boxShadow: T.shadowModal,
        animation: `af-scale ${motion.duration.normal} ${motion.easing.spring}`,
      },
      header: {
        padding: `${space.xl} ${space.xl} ${space.lg}`,
        borderBottom: `${borderWidth.default} solid ${T.borderDefault}`,
      },
      body: {
        padding: space.xl,
      },
      footer: {
        padding: `${space.lg} ${space.xl} ${space.xl}`,
        display: "flex",
        justifyContent: "flex-end",
        gap: space.sm,
      },
    },

    /* ─── Badge / Tag ─── */
    badge: {
      status: (variant: "success" | "warning" | "danger" | "info" | "brand") => {
        const map = {
          success: { bg: T.successBg, text: T.successText, border: T.successBorder },
          warning: { bg: T.warningBg, text: T.warningText, border: T.warningBorder },
          danger:  { bg: T.dangerBg,  text: T.dangerText,  border: T.dangerBorder  },
          info:    { bg: T.infoBg,    text: T.infoText,    border: T.infoBorder    },
          brand:   { bg: T.brandLight,text: T.brandText,   border: T.brandBorder   },
        };
        return {
          display: "inline-flex",
          alignItems: "center",
          padding: `2px ${space.sm}`,
          borderRadius: radius.badge,
          border: `${borderWidth.default} solid ${map[variant].border}`,
          background: map[variant].bg,
          color: map[variant].text,
          fontSize: typography.size11,
          fontWeight: typography.weightSemibold,
          fontFamily: typography.fontFamilyBody,
          lineHeight: typography.lineHeightNormal,
          whiteSpace: "nowrap" as const,
        };
      },
      neutral: {
        display: "inline-flex",
        alignItems: "center",
        padding: `2px ${space.sm}`,
        borderRadius: radius.badgeSquared,
        border: `${borderWidth.default} solid ${T.neutralBadgeBg}`,
        background: T.neutralBadgeBg,
        color: T.neutralBadgeText,
        fontSize: typography.size11,
        fontWeight: typography.weightSemibold,
        fontFamily: typography.fontFamilyBody,
      },
    },

    /* ─── Toast ─── */
    toast: {
      container: {
        position: "fixed" as const,
        bottom: space["2xl"],
        left: "50%",
        transform: "translateX(-50%)",
        background: T.mode === "dark" ? T.bgSurfaceAlt : T.interactivePrimary,
        color: T.mode === "dark" ? T.textPrimary : T.interactivePrimaryText,
        padding: `${space.md} ${space.xl}`,
        borderRadius: radius.toast,
        fontSize: typography.size13,
        fontWeight: typography.weightMedium,
        boxShadow: T.shadowModal,
        display: "flex",
        alignItems: "center",
        gap: space.sm,
        zIndex: zIndex.toast,
        border: `${borderWidth.default} solid ${T.borderDefault}`,
        animation: `af-toast ${motion.duration.normal} ${motion.easing.spring}`,
        whiteSpace: "nowrap" as const,
      },
    },

    /* ─── Sidebar ─── */
    sidebar: {
      aside: {
        width: "100%",
        height: "100%",
        background: T.bgSidebar,
        borderRight: `${borderWidth.default} solid ${T.borderSidebar}`,
        display: "flex",
        flexDirection: "column" as const,
      },
      navItem: {
        base: {
          display: "flex",
          alignItems: "center",
          gap: space.sm,
          width: "100%",
          padding: `${space.sm} ${space.sidebarPaddingX}`,
          borderRadius: radius.sidebar,
          marginBottom: "2px",
          border: "none",
          background: "transparent",
          color: T.sidebarMuted,
          fontSize: typography.size13,
          fontWeight: typography.weightRegular,
          cursor: "pointer",
          fontFamily: typography.fontFamilyBody,
          textAlign: "left" as const,
          transition: motion.transition.colors,
        },
        active: {
          background: T.sidebarActiveBg,
          color: T.sidebarActive,
          fontWeight: typography.weightSemibold,
        },
      },
    },

    /* ─── Table ─── */
    table: {
      container: {
        background: T.bgSurface,
        borderRadius: radius.card,
        border: `${borderWidth.default} solid ${T.borderDefault}`,
        boxShadow: T.shadowCard,
        overflow: "hidden",
      },
      head: {
        background: T.bgSurfaceAlt,
      },
      th: {
        padding: `${space.sm} ${space.lg}`,
        fontSize: typography.size10,
        fontWeight: typography.weightSemibold,
        color: T.textMuted,
        letterSpacing: "0.8px",
        fontFamily: typography.fontFamilyMono,
        textTransform: "uppercase" as const,
        borderBottom: `${borderWidth.default} solid ${T.borderDefault}`,
        textAlign: "left" as const,
        whiteSpace: "nowrap" as const,
      },
      td: {
        padding: `${space.lg} ${space.lg}`,
        borderBottom: `${borderWidth.default} solid ${T.borderDefault}`,
        fontSize: typography.size13,
        color: T.textSecondary,
        transition: motion.transition.colors,
      },
      trHover: {
        background: T.bgSurfaceHover,
      },
    },

    /* ─── Progress Bar ─── */
    progressBar: {
      track: {
        height: "5px",
        background: T.bgSurfaceAlt,
        borderRadius: radius.full,
        overflow: "hidden",
      },
      fill: (value: number) => ({
        height: "100%",
        width: `${value}%`,
        background: value >= 100 ? T.successText : value > 50 ? T.brandDefault : T.infoText,
        borderRadius: radius.full,
        transition: motion.transition.progress,
      }),
    },

    /* ─── Stat / KPI Card ─── */
    kpiCard: {
      container: {
        background: T.bgSurface,
        border: `${borderWidth.default} solid ${T.borderDefault}`,
        borderRadius: radius.card,
        padding: space.cardPadding,
        boxShadow: T.shadowCard,
        position: "relative" as const,
        overflow: "hidden",
        transition: motion.transition.shadow,
      },
      glow: {
        position: "absolute" as const,
        top: "-18px",
        right: "-18px",
        width: "70px",
        height: "70px",
        borderRadius: radius.full,
        background: T.brandLight,
        opacity: 0.6,
        pointerEvents: "none" as const,
      },
      label: {
        fontSize: typography.size10,
        color: T.textMuted,
        fontFamily: typography.fontFamilyMono,
        textTransform: "uppercase" as const,
        letterSpacing: "0.5px",
        fontWeight: typography.weightMedium,
      },
      value: {
        fontSize: typography.size32,
        fontWeight: typography.weightBold,
        color: T.textPrimary,
        letterSpacing: "-0.05em",
        lineHeight: typography.lineHeightNone,
        fontFamily: typography.fontFamilyDisplay,
      },
      subtext: {
        fontSize: typography.size11,
        color: T.textMuted,
      },
    },

    /* ─── Page Layout ─── */
    page: {
      wrapper: {
        fontFamily: typography.fontFamilyBody,
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: T.bgOuter,
      },
      frame: {
        width: "100%",
        maxWidth: grid.maxWidth.content,
        background: T.bgCanvas,
        display: "flex",
        flexDirection: "row" as const,
        overflow: "hidden",
        boxShadow: T.shadowWindow,
        border: `${borderWidth.default} solid ${T.borderDefault}`,
      },
      main: {
        flex: 1,
        overflowY: "auto" as const,
        background: T.bgCanvas,
        transition: "background 0.3s ease",
      },
      content: {
        padding: space.pageGutter,
        display: "flex",
        flexDirection: "column" as const,
      },
    },

    /* ─── Empty State ─── */
    emptyState: {
      container: {
        padding: `${space["3xl"]} ${space["2xl"]}`,
        textAlign: "center" as const,
        color: T.textMuted,
        fontSize: typography.size13,
      },
      dashed: {
        borderRadius: radius.cardSM,
        border: `${borderWidth.dashed} dashed ${T.borderDefault}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: motion.transition.colors,
      },
    },

    /* ─── Divider ─── */
    divider: {
      horizontal: {
        height: borderWidth.default,
        background: T.borderDefault,
        border: "none",
        margin: `${space.md} 0`,
      },
      vertical: {
        width: borderWidth.default,
        background: T.borderDefault,
        border: "none",
        alignSelf: "stretch",
      },
    },

    /* ─── Avatar ─── */
    avatar: (size: "sm" | "md" | "lg" | "xl" = "md") => {
      const sizeMap = { sm: "22px", md: "28px", lg: "34px", xl: "44px" };
      const fontMap = { sm: typography.size8, md: typography.size10, lg: typography.size12, xl: typography.size14 };
      return {
        width: sizeMap[size],
        height: sizeMap[size],
        borderRadius: radius.full,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: fontMap[size],
        fontWeight: typography.weightBold,
        color: "#fff",
        border: `2px solid ${T.bgSurface}`,
        flexShrink: 0,
        overflow: "hidden",
      };
    },

    /* ─── Tabs ─── */
    tabs: {
      list: {
        display: "flex",
        gap: "4px",
        borderBottom: `${borderWidth.default} solid ${T.borderDefault}`,
      },
      tab: {
        padding: `${space.sm} ${space.lg}`,
        border: "none",
        background: "none",
        fontSize: typography.size13,
        color: T.textMuted,
        cursor: "pointer",
        fontFamily: typography.fontFamilyBody,
        fontWeight: typography.weightMedium,
        borderBottom: `2px solid transparent`,
        marginBottom: "-1px",
        transition: motion.transition.colors,
      },
      tabActive: {
        color: T.textPrimary,
        fontWeight: typography.weightBold,
        borderBottomColor: T.brandDefault,
      },
    },

    /* ─── Settings nav item ─── */
    settingsNavItem: {
      base: {
        display: "flex",
        alignItems: "center",
        gap: space.sm,
        width: "100%",
        padding: `${space.sm} space.md`,
        borderRadius: radius.xl,
        border: "none",
        background: "transparent",
        color: T.textSecondary,
        fontSize: typography.size13,
        fontWeight: typography.weightRegular,
        cursor: "pointer",
        fontFamily: typography.fontFamilyBody,
        textAlign: "left" as const,
        transition: motion.transition.all,
      },
      active: {
        background: T.bgSurfaceAlt,
        color: T.textPrimary,
        fontWeight: typography.weightSemibold,
      },
    },
  };
}

/* ══════════════════════════════════════════════════════════════
   FONT IMPORT STRING
══════════════════════════════════════════════════════════════ */
export const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700&display=swap');`;

/* ══════════════════════════════════════════════════════════════
   GLOBAL RESET / BASE CSS STRING
══════════════════════════════════════════════════════════════ */
export const baseCSS = `
${fontImport}

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; width: 100%; }

/* Scrollbar — hidden by default, styled per-container */
* { scrollbar-width: none !important; -ms-overflow-style: none !important; }
*::-webkit-scrollbar { display: none !important; }

/* Scrollable area — apply .af-scroll class */
.af-scroll {
  overflow-y: auto;
  scrollbar-width: thin !important;
  scrollbar-color: var(--af-scroll-thumb) transparent !important;
}
.af-scroll::-webkit-scrollbar { display: block !important; width: 4px !important; }
.af-scroll::-webkit-scrollbar-thumb { background: var(--af-scroll-thumb) !important; border-radius: 4px !important; }

.af-scroll-x {
  overflow-x: auto;
  scrollbar-width: thin !important;
  scrollbar-color: var(--af-scroll-thumb) transparent !important;
}
.af-scroll-x::-webkit-scrollbar { display: block !important; height: 4px !important; }
.af-scroll-x::-webkit-scrollbar-thumb { background: var(--af-scroll-thumb) !important; border-radius: 4px !important; }

/* Keyframes */
${Object.values(motion.keyframes).join("\n")}
`;

/* ══════════════════════════════════════════════════════════════
   CONVENIENCE RE-EXPORTS
══════════════════════════════════════════════════════════════ */
export const tokens = {
  palette,
  typography,
  textStyles,
  spacing,
  space,
  radius,
  borderWidth,
  shadows,
  opacity,
  zIndex,
  breakpoints,
  mediaQueries,
  grid,
  motion,
  iconography,
};

export default tokens;
