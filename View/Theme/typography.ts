import {Platform, TextStyle} from 'react-native';

/**
 * Apple text styles mapped to React Native `TextStyle` objects, built on the
 * system font. Values follow the iOS Human Interface Guidelines type scale.
 *
 * Dynamic Type: `allowFontScaling` is a `<Text>` prop (not a style), so it is
 * exported here as {@link allowFontScaling} for components to spread onto their
 * `<Text>` elements. It defaults to `true` so text scales with the user's
 * preferred content size.
 *
 * No color literals live here — color is always supplied from the theme.
 */

/** System font family. `undefined` lets RN use the platform default (SF on iOS). */
const systemFont = Platform.select<string | undefined>({
  ios: 'System',
  default: undefined,
});

/** Monospaced family token for logs, build numbers, commit hashes, branches. */
export const mono = Platform.select<string>({
  ios: 'Menlo',
  default: 'monospace',
});

/**
 * Dynamic Type flag to spread onto `<Text>` / `<TextInput>`:
 *
 * @example
 * <Text style={type.body} {...type.dynamicType}>Hello</Text>
 */
export const allowFontScaling = true;

/** Convenience object to spread the Dynamic Type flag onto text components. */
export const dynamicType = {allowFontScaling} as const;

const base: TextStyle = {fontFamily: systemFont};

/** Large title — top-level screen headings. */
export const largeTitle: TextStyle = {
  ...base,
  fontSize: 34,
  lineHeight: 41,
  fontWeight: '700',
};

/** Title 2 — section headings. */
export const title2: TextStyle = {
  ...base,
  fontSize: 22,
  lineHeight: 28,
  fontWeight: '600',
};

/** Headline — emphasized body (row titles). */
export const headline: TextStyle = {
  ...base,
  fontSize: 17,
  lineHeight: 22,
  fontWeight: '600',
};

/** Body — default reading text. */
export const body: TextStyle = {
  ...base,
  fontSize: 17,
  lineHeight: 22,
  fontWeight: '400',
};

/** Callout — slightly smaller than body. */
export const callout: TextStyle = {
  ...base,
  fontSize: 16,
  lineHeight: 21,
  fontWeight: '400',
};

/** Subheadline — secondary supporting text. */
export const subheadline: TextStyle = {
  ...base,
  fontSize: 15,
  lineHeight: 20,
  fontWeight: '400',
};

/** Footnote — small print / hints. */
export const footnote: TextStyle = {
  ...base,
  fontSize: 13,
  lineHeight: 18,
  fontWeight: '400',
};

/** Caption — smallest metadata text. */
export const caption: TextStyle = {
  ...base,
  fontSize: 12,
  lineHeight: 16,
  fontWeight: '400',
};
