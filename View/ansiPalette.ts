/**
 * Theme-driven ANSI color palette for build logs.
 *
 * This module is the single source of truth for the ANSI color literals used
 * when rendering logs (the one documented exception to the "no color literals
 * in components" rule — an ANSI palette is itself a color table). The `anser`
 * library emits deterministic `rgb` triples for the 16 standard ANSI colors;
 * we intercept those exact triples and remap them to hand-tuned values that
 * stay WCAG-AA readable on the themed log surface in BOTH light and dark mode.
 *
 * Default foreground (no `fg` on the parsed entry) is NOT handled here as a
 * literal — callers resolve it to the theme `label` color via
 * {@link resolveAnsiFg}, so the log text follows the active theme.
 */

import {ColorSchemeName} from './Theme/colors';

/** The 16 standard ANSI color keys (8 normal + 8 bright variants). */
export type AnsiColorKey =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'bright-black'
  | 'bright-red'
  | 'bright-green'
  | 'bright-yellow'
  | 'bright-blue'
  | 'bright-magenta'
  | 'bright-cyan'
  | 'bright-white';

/**
 * Normalize an anser rgb string so inconsistent spacing collapses to one key.
 * anser emits e.g. `"255, 255, 255"` for some colors and `"255,255,255"` for
 * others; stripping whitespace makes both resolve to the same palette key.
 */
export function normalizeRgb(fg: string): string {
  return fg.replace(/\s+/g, '');
}

/**
 * Map of anser's EXACT emitted `fg` strings to our semantic ANSI keys.
 *
 * `white` (code 37) and `bright-white` (code 97) are the only two ANSI colors
 * that share the same RGB triple (255,255,255). anser disambiguates them by a
 * quirk of its formatting: it emits `"255,255,255"` (no spaces) for `white` and
 * `"255, 255, 255"` (with spaces) for `bright-white`. We therefore key this
 * map on the raw strings so BOTH are reachable; `resolveAnsiFg` consults it
 * first before falling back to the whitespace-normalized map below, which stays
 * robust if anser ever varies the spacing for the other 14 colors.
 */
export const ANSER_RAW_TO_KEY: Record<string, AnsiColorKey> = {
  '0, 0, 0': 'black',
  '187, 0, 0': 'red',
  '0, 187, 0': 'green',
  '187, 187, 0': 'yellow',
  '0, 0, 187': 'blue',
  '187, 0, 187': 'magenta',
  '0, 187, 187': 'cyan',
  '255,255,255': 'white',
  '85, 85, 85': 'bright-black',
  '255, 85, 85': 'bright-red',
  '0, 255, 0': 'bright-green',
  '255, 255, 85': 'bright-yellow',
  '85, 85, 255': 'bright-blue',
  '255, 85, 255': 'bright-magenta',
  '85, 255, 255': 'bright-cyan',
  '255, 255, 255': 'bright-white',
};

/**
 * Map of anser's emitted rgb triples (whitespace-normalized) to our semantic
 * ANSI keys. Used as a fallback when the exact-string lookup misses. Because
 * normalization collapses `white` and `bright-white` to one key, the shared
 * `255,255,255` triple resolves to `white` here; `bright-white` is only
 * reachable via the exact-string {@link ANSER_RAW_TO_KEY} map above.
 */
export const ANSER_RGB_TO_KEY: Record<string, AnsiColorKey> = {
  [normalizeRgb('0, 0, 0')]: 'black',
  [normalizeRgb('187, 0, 0')]: 'red',
  [normalizeRgb('0, 187, 0')]: 'green',
  [normalizeRgb('187, 187, 0')]: 'yellow',
  [normalizeRgb('0, 0, 187')]: 'blue',
  [normalizeRgb('187, 0, 187')]: 'magenta',
  [normalizeRgb('0, 187, 187')]: 'cyan',
  [normalizeRgb('255,255,255')]: 'white',
  [normalizeRgb('85, 85, 85')]: 'bright-black',
  [normalizeRgb('255, 85, 85')]: 'bright-red',
  [normalizeRgb('0, 255, 0')]: 'bright-green',
  [normalizeRgb('255, 255, 85')]: 'bright-yellow',
  [normalizeRgb('85, 85, 255')]: 'bright-blue',
  [normalizeRgb('255, 85, 255')]: 'bright-magenta',
  [normalizeRgb('85, 255, 255')]: 'bright-cyan',
};

/**
 * Resolve an anser `fg` string to a semantic ANSI key, or `null` if it is not
 * one of the 16 standard ANSI colors. Prefers the exact-string match (so
 * `white` vs `bright-white` stay distinct) and falls back to the normalized
 * lookup.
 */
export function ansiKeyForFg(fg: string): AnsiColorKey | null {
  return ANSER_RAW_TO_KEY[fg] ?? ANSER_RGB_TO_KEY[normalizeRgb(fg)] ?? null;
}

/**
 * Dark-mode palette. The log surface is `secondaryBackground` (`#1C1C1E` on
 * Android dark / `secondarySystemBackground` on iOS), so colors use the vivid
 * "dark mode" variants and the near-black entries (black / bright-black) are
 * lifted to a visible grey so dim text is never invisible.
 */
const darkPalette: Record<AnsiColorKey, string> = {
  black: '#8E8E93',
  red: '#FF6961',
  green: '#30D158',
  yellow: '#FFD426',
  blue: '#64D2FF',
  magenta: '#FF6AC1',
  cyan: '#5AC8FA',
  white: '#EBEBF5',
  'bright-black': '#AEAEB2',
  'bright-red': '#FF8A80',
  'bright-green': '#6EE787',
  'bright-yellow': '#FFE066',
  'bright-blue': '#82CFFF',
  'bright-magenta': '#FF9AD5',
  'bright-cyan': '#7DDBFF',
  'bright-white': '#FFFFFF',
};

/**
 * Light-mode palette. The log surface is `secondaryBackground` (`#F2F2F7` on
 * Android light), so colors use darker variants for AA contrast and the near-
 * white entries (white / bright-white) are darkened to a readable grey so they
 * are not invisible on the light surface.
 */
const lightPalette: Record<AnsiColorKey, string> = {
  black: '#1C1C1E',
  red: '#C50F1F',
  green: '#1E7E34',
  // Darkened to ≥4.5:1 on the light log surface #F2F2F7 (was #8A6D00 = 4.41).
  yellow: '#7A5E00',
  blue: '#0040DD',
  magenta: '#A3008F',
  cyan: '#0B6E7A',
  white: '#6C6C70',
  'bright-black': '#48484A',
  // Darkened to ≥4.5:1 on #F2F2F7 (was #D63D2C = 4.12).
  'bright-red': '#C0290F',
  // Darkened to ≥4.5:1 on #F2F2F7 (was #2E8B3D = 3.86).
  'bright-green': '#277030',
  // Darkened to ≥4.5:1 on #F2F2F7 (was #9C7A00 = 3.62).
  'bright-yellow': '#7A5E00',
  'bright-blue': '#0A58CA',
  'bright-magenta': '#B5179E',
  // Darkened to clear the 4.5:1 bar on #F2F2F7 (was #117A8B = 4.50 borderline).
  'bright-cyan': '#0E6C7A',
  'bright-white': '#3C3C43',
};

/** Return the tuned ANSI palette for the given color scheme. */
export function getAnsiPalette(
  scheme: ColorSchemeName,
): Record<AnsiColorKey, string> {
  return scheme === 'dark' ? darkPalette : lightPalette;
}

/**
 * Resolve the themed foreground color for a parsed anser entry.
 *
 * - `null`/empty `fg` (default foreground) → the theme `label` color, so log
 *   text follows the active theme.
 * - A recognized ANSI triple → the tuned palette value for the scheme.
 * - An unrecognized `fg` (e.g. a 256-color/truecolor sequence anser passed
 *   through) → the theme `label` color, so it stays readable rather than
 *   rendering an arbitrary, possibly-invisible rgb value.
 */
export function resolveAnsiFg(
  fg: string | null | undefined,
  scheme: ColorSchemeName,
  labelColor: string,
): string {
  if (fg == null || fg === '') {
    return labelColor;
  }
  const key = ansiKeyForFg(fg);
  if (key == null) {
    return labelColor;
  }
  return getAnsiPalette(scheme)[key];
}
