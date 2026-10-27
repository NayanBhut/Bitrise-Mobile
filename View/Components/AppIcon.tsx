import React from 'react';
import {Platform, StyleSheet, Text, TextStyle} from 'react-native';
import {
  SFSymbolAnimationType,
  SFSymbolRenderingMode,
  SFSymbolScale,
  SFSymbolView,
  SFSymbolWeight,
} from 'react-native-nitro-sfsymbols';
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
  /** Tint color (hex string on iOS). Defaults to the system label color. */
  color?: string;
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
    return (
      <SFSymbolView
        name={mapping.ios}
        size={size}
        weight={weight}
        scale={scale}
        tintColor={color}
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
    ...(color ? {color} : null),
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
