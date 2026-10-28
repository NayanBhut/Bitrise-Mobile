import React from 'react';
import {Platform, StyleSheet, Text, TextStyle} from 'react-native';
import {
  SFSymbolAnimationType,
  SFSymbolRenderingMode,
  SFSymbolScale,
  SFSymbolView,
  SFSymbolWeight,
} from 'react-native-nitro-sfsymbols';
import {ColorToken} from '../Theme/colors';
import {icons, IconName} from '../Theme/icons';
import {useTheme} from '../Theme/useTheme';

/** Stroke weight matched to adjacent text. */
export type AppIconWeight = SFSymbolWeight;
/** Visual scale of the symbol. */
export type AppIconScale = SFSymbolScale;
/** Color rendering mode. */
export type AppIconRendering = SFSymbolRenderingMode;
/** Symbol effect; applied only when Reduce Motion is off. */
export type AppIconEffect = SFSymbolAnimationType;

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
   * On iOS the native SF Symbols view parses `tintColor` as a hex string, so a
   * hex color is applied directly; a `PlatformColor` `OpaqueColorValue` (which
   * cannot be expressed as hex) is not forwarded and the symbol keeps the
   * dynamic system label tint, which already tracks light/dark automatically.
   * On Android the token (hex string in both schemes) is applied to the glyph.
   */
  color?: ColorToken;
  /** Color rendering mode (iOS). */
  rendering?: AppIconRendering;
  /** Symbol effect (iOS 17+); skipped when Reduce Motion is enabled. */
  effect?: AppIconEffect;
  /**
   * When provided, the icon is exposed to assistive tech with this label.
   * Otherwise the icon is decorative and hidden from screen readers.
   */
  accessibilityLabel?: string;
}

/**
 * Cross-platform icon wrapper. Renders an SF Symbol on iOS via
 * `react-native-nitro-sfsymbols` and the mapped Material Symbol glyph on
 * Android. Decorative by default; pass `accessibilityLabel` to expose it.
 *
 * Symbol effects are applied only when `useTheme().reduceMotion` is `false`.
 */
export function AppIcon({
  name,
  size = 24,
  weight,
  scale,
  color,
  rendering,
  effect,
  accessibilityLabel,
}: AppIconProps) {
  const {reduceMotion} = useTheme();
  const mapping = icons[name];
  const hasLabel = accessibilityLabel != null;

  if (Platform.OS === 'ios') {
    // The native view parses `tintColor` as a hex string; forward a hex string
    // so it is applied, and omit a non-string PlatformColor token so the symbol
    // keeps its dynamic system label tint rather than an unparseable value.
    const tint = typeof color === 'string' ? color : undefined;
    return (
      <SFSymbolView
        name={mapping.ios}
        size={size}
        weight={weight}
        scale={scale}
        tintColor={tint}
        renderingMode={rendering}
        animation={
          effect && !reduceMotion ? {type: effect, repeating: true} : undefined
        }
        accessibilityLabel={accessibilityLabel}
      />
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
