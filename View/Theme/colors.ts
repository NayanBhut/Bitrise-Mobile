import {OpaqueColorValue, Platform, PlatformColor} from 'react-native';

/**
 * Semantic color tokens for the app. Every component consumes colors through
 * these tokens via `useTheme()`; no component may use a raw color literal.
 *
 * On iOS each token resolves to an Apple semantic color via `PlatformColor`,
 * so light/dark, Increase Contrast, and future OS changes resolve
 * automatically. On Android we provide a hand-tuned palette keyed by the
 * current color scheme that meets WCAG AA contrast in both modes.
 *
 * NOTE: raw color literals are allowed ONLY in this file (the Android palette).
 */
export interface ThemeColors {
  /** Base window background. */
  background: ColorToken;
  /** Secondary background (elevated surfaces). */
  secondaryBackground: ColorToken;
  /** Grouped-table background. */
  groupedBackground: ColorToken;
  /** Secondary grouped background (cards/rows inside a grouped list). */
  secondaryGroupedBackground: ColorToken;
  /** Primary label text. */
  label: ColorToken;
  /** Secondary label text. */
  secondaryLabel: ColorToken;
  /** Tertiary label text. */
  tertiaryLabel: ColorToken;
  /** Hairline separators. */
  separator: ColorToken;
  /** Fill color for subtle backgrounds (e.g. secondary button tint). */
  fill: ColorToken;
  /** Accent / tint color used sparingly for interactive elements. */
  accent: ColorToken;
  /** Status: build succeeded. */
  statusSuccess: ColorToken;
  /** Status: build failed. */
  statusFailed: ColorToken;
  /** Status: build in progress. */
  statusInProgress: ColorToken;
  /** Status: build on hold. */
  statusOnHold: ColorToken;
  /** Status: build aborted. */
  statusAborted: ColorToken;
  /** Destructive action color (Abort, Log Out). */
  destructive: ColorToken;
  /** Foreground color for text/icons placed on a filled accent/destructive surface. */
  onFill: ColorToken;
}

/** A color value usable by React Native style props. */
export type ColorToken = string | OpaqueColorValue;

/** The two color schemes the app resolves against. */
export type ColorSchemeName = 'light' | 'dark';

/**
 * iOS tokens resolve to Apple semantic colors. These automatically adapt to
 * light/dark and the user's Increase Contrast setting.
 */
const iosColors: ThemeColors = {
  background: PlatformColor('systemBackground'),
  secondaryBackground: PlatformColor('secondarySystemBackground'),
  groupedBackground: PlatformColor('systemGroupedBackground'),
  secondaryGroupedBackground: PlatformColor('secondarySystemGroupedBackground'),
  label: PlatformColor('label'),
  secondaryLabel: PlatformColor('secondaryLabel'),
  tertiaryLabel: PlatformColor('tertiaryLabel'),
  separator: PlatformColor('separator'),
  fill: PlatformColor('systemFill'),
  accent: PlatformColor('systemBlue'),
  statusSuccess: PlatformColor('systemGreen'),
  statusFailed: PlatformColor('systemRed'),
  statusInProgress: PlatformColor('systemBlue'),
  statusOnHold: PlatformColor('systemOrange'),
  statusAborted: PlatformColor('systemGray'),
  destructive: PlatformColor('systemRed'),
  // White reads AA on systemBlue/systemRed fills in both light and dark.
  onFill: 'white',
};

/**
 * Android light palette. Hand-tuned to mirror Apple's system colors while
 * meeting WCAG AA contrast on light surfaces. These are the only raw color
 * literals permitted in the codebase.
 */
const androidLight: ThemeColors = {
  background: '#FFFFFF',
  secondaryBackground: '#F2F2F7',
  groupedBackground: '#F2F2F7',
  secondaryGroupedBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#6C6C70',
  separator: '#C6C6C8',
  fill: '#E5E5EA',
  accent: '#007AFF',
  statusSuccess: '#1E7E34',
  statusFailed: '#C50F1F',
  statusInProgress: '#0040DD',
  statusOnHold: '#B25E00',
  statusAborted: '#636366',
  destructive: '#C50F1F',
  onFill: '#FFFFFF',
};

/**
 * Android dark palette. Hand-tuned for AA contrast on dark surfaces using the
 * brighter "vivid" variants Apple ships in dark mode.
 */
const androidDark: ThemeColors = {
  background: '#000000',
  secondaryBackground: '#1C1C1E',
  groupedBackground: '#000000',
  secondaryGroupedBackground: '#1C1C1E',
  label: '#FFFFFF',
  secondaryLabel: '#EBEBF5',
  tertiaryLabel: '#C7C7CC',
  separator: '#38383A',
  fill: '#2C2C2E',
  accent: '#0A84FF',
  statusSuccess: '#30D158',
  statusFailed: '#FF453A',
  statusInProgress: '#409CFF',
  statusOnHold: '#FF9F0A',
  statusAborted: '#98989D',
  destructive: '#FF453A',
  onFill: '#FFFFFF',
};

/**
 * Resolve the semantic color tokens for the given scheme.
 *
 * On iOS the scheme is ignored because `PlatformColor` already adapts; on
 * Android we select the hand-tuned palette for the active scheme.
 */
export function getColors(scheme: ColorSchemeName | null | undefined): ThemeColors {
  if (Platform.OS === 'ios') {
    return iosColors;
  }
  return scheme === 'dark' ? androidDark : androidLight;
}
