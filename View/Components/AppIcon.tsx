import React from 'react';
import {Platform, StyleSheet, Text, TextStyle, View} from 'react-native';
import {SFSymbol} from '@mythologi/react-native-sfsymbols';
import {ColorToken} from '../Theme/colors';
import {icons, IconName} from '../Theme/icons';

/**
 * Stroke weight matched to adjacent text. String enum accepted by the
 * `react-native-sfsymbols` (iOS 13+) `<SFSymbol weight>` prop.
 */
export type AppIconWeight =
  | 'ultralight'
  | 'light'
  | 'thin'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy';
/** Visual scale of the symbol. */
export type AppIconScale = 'small' | 'medium' | 'large';
/**
 * Color rendering mode. Retained for source-compatibility only; the iOS-13
 * library renders monochrome (plus `multicolor`) and does NOT support
 * hierarchical/palette rendering, so this prop is accepted but ignored.
 */
export type AppIconRendering =
  | 'monochrome'
  | 'hierarchical'
  | 'palette'
  | 'multicolor';
/**
 * Symbol effect. Retained for source-compatibility only; the iOS-13 library
 * has no native symbol effects (bounce/pulse/variableColor), so this prop is
 * accepted but NOT forwarded to the native symbol. Running-build motion is
 * driven in JS by the caller (see StatusBadge), gated on Reduce Motion.
 */
export type AppIconEffect =
  | 'bounce'
  | 'pulse'
  | 'scale'
  | 'rotate'
  | 'appear'
  | 'disappear'
  | 'replace'
  | 'variableColor';

export interface AppIconProps {
  /** Semantic icon name resolved through the theme icon map. */
  name: IconName;
  /** Point size. Default 24 (matches the native default). */
  size?: number;
  /** Stroke weight. */
  weight?: AppIconWeight;
  /** Visual scale. */
  scale?: AppIconScale;
  /**
   * Tint color. Accepts any theme {@link ColorToken} so callers can pass a
   * color straight from `useTheme().colors` without stringifying it.
   *
   * On iOS a hex string is forwarded to the SF Symbol's `color` prop; a
   * `PlatformColor` `OpaqueColorValue` (which cannot be expressed as hex) is
   * not forwarded and the symbol keeps the dynamic system label tint, which
   * already tracks light/dark automatically. On Android the token (hex string
   * in both schemes) is applied to the glyph.
   */
  color?: ColorToken;
  /**
   * Color rendering mode (iOS). Accepted but ignored: the iOS-13 library does
   * not support hierarchical/palette rendering.
   */
  rendering?: AppIconRendering;
  /**
   * Symbol effect. Accepted but ignored on the native symbol: the iOS-13
   * library has no native symbol effects. Running-build motion is handled in
   * JS by the caller (see StatusBadge), gated on Reduce Motion.
   */
  effect?: AppIconEffect;
  /**
   * When provided, the icon is exposed to assistive tech with this label.
   * Otherwise the icon is decorative and hidden from screen readers.
   */
  accessibilityLabel?: string;
}

/**
 * Cross-platform icon wrapper. Renders an SF Symbol on iOS via
 * `react-native-sfsymbols` (the iOS-13+ fork) and the mapped Material Symbol
 * glyph on Android. Decorative by default; pass `accessibilityLabel` to
 * expose it.
 *
 * BEHAVIOR CHANGE (iOS-13 library tradeoff): the app must support iOS 13.0, so
 * the icon library was switched from `react-native-nitro-sfsymbols` (locked to
 * iOS 16.0) to the iOS-13 `react-native-sfsymbols` fork. That library does NOT
 * provide native symbol effects (bounce/pulse/variableColor) or
 * hierarchical/palette rendering. Consequently:
 *   - `effect` is retained in the API but is a no-op on the native symbol. The
 *     running-build animation is now driven in JS with react-native-reanimated
 *     by the caller (StatusBadge), gated on `useTheme().reduceMotion`.
 *   - `rendering` is retained in the API but ignored (monochrome only).
 */
// Note: `rendering` and `effect` are part of AppIconProps and accepted for
// source-compatibility, but they are intentionally NOT destructured here or
// forwarded to the native symbol — the iOS-13 library supports neither (see
// the behavior note above).
export function AppIcon({
  name,
  size = 24,
  weight,
  scale,
  color,
  accessibilityLabel,
}: AppIconProps) {
  const mapping = icons[name];
  const hasLabel = accessibilityLabel != null;

  if (Platform.OS === 'ios') {
    // Forward a hex string tint directly; omit a non-string PlatformColor token
    // so the symbol keeps its dynamic system label tint rather than an
    // unparseable value. (The fork's `color` could accept PlatformColor via
    // processColor, but we intentionally preserve the existing
    // hex-only-forward behavior AppIcon has today.)
    const tint = typeof color === 'string' ? color : undefined;
    // The fork's `SFSymbol` props type does not declare `accessibilityLabel`,
    // so carry accessibility on a wrapping View: labelled when provided,
    // decorative (hidden from screen readers) by default — matching the Android
    // branch's semantics.
    return (
      <View
        accessible={hasLabel}
        accessibilityLabel={accessibilityLabel}
        accessibilityElementsHidden={!hasLabel}
        importantForAccessibility={hasLabel ? 'yes' : 'no-hide-descendants'}>
        <SFSymbol
          // `icons[name].ios` is a plain SF Symbol string; the fork types
          // `name` as a large `SymbolName` union, so cast at this one call site.
          name={mapping.ios as never}
          size={size}
          weight={weight}
          scale={scale}
          color={tint}
        />
      </View>
    );
  }

  // Android: render the mapped Material Symbol name. The Material Symbols font
  // is wired in a later task; until then this stays self-contained without a
  // new native font dependency.
  const androidStyle: TextStyle = {
    fontSize: size,
    ...(color != null ? {color} : null),
  };
  return (
    <Text
      style={[styles.androidGlyph, androidStyle]}
      accessible={hasLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!hasLabel}
      importantForAccessibility={hasLabel ? 'yes' : 'no-hide-descendants'}
      allowFontScaling>
      {mapping.android}
    </Text>
  );
}

const styles = StyleSheet.create({
  androidGlyph: {
    fontFamily: 'Material Symbols Outlined',
  },
});

export default AppIcon;
