import React, {useEffect} from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {useTheme} from '../Theme/useTheme';

export interface SkeletonRowProps {
  /** Number of placeholder bars: 2 (title + subtitle) by default, or 1. */
  lines?: 1 | 2;
  /** Optional test identifier forwarded to the row container. */
  testID?: string;
  /** Optional style override merged onto the row container. */
  style?: StyleProp<ViewStyle>;
}

/** Static opacity used for the Reduce Motion (non-animated) placeholder. */
const STATIC_OPACITY = 0.5;

/**
 * Placeholder row shown while content loads. It drives a subtle opacity
 * shimmer with Reanimated, and falls back to a static dimmed placeholder when
 * the user has Reduce Motion enabled.
 */
export function SkeletonRow({lines = 2, testID, style}: SkeletonRowProps) {
  const {colors, spacing, reduceMotion} = useTheme();

  // Hooks run unconditionally; the shimmer is only started when motion is on.
  const shimmer = useSharedValue(STATIC_OPACITY);
  const animatedStyle = useAnimatedStyle(() => ({opacity: shimmer.value}));

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    shimmer.value = withRepeat(withTiming(1, {duration: 800}), -1, true);
  }, [reduceMotion, shimmer]);

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    {
      minHeight: spacing.minTouchTarget,
      paddingVertical: spacing.spacing.sm,
      paddingHorizontal: spacing.spacing.md,
      backgroundColor: colors.secondaryGroupedBackground,
    },
    style,
  ];

  const barBase: ViewStyle = {
    backgroundColor: colors.fill,
    borderRadius: spacing.radius.sm,
  };
  const titleBarStyle: StyleProp<ViewStyle> = [styles.titleBar, barBase];
  const subtitleBarStyle: StyleProp<ViewStyle> = [
    styles.subtitleBar,
    barBase,
    {marginTop: spacing.spacing.sm},
  ];

  const bars = (
    <View style={styles.bars}>
      <View style={titleBarStyle} testID="skeleton-bar-title" />
      {lines === 2 ? (
        <View style={subtitleBarStyle} testID="skeleton-bar-subtitle" />
      ) : null}
    </View>
  );

  if (reduceMotion) {
    return (
      <View style={containerStyle} testID={testID} accessibilityElementsHidden>
        <View style={styles.static} testID="skeleton-static">
          {bars}
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle} testID={testID} accessibilityElementsHidden>
      <Animated.View style={animatedStyle} testID="skeleton-animated">
        {bars}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  static: {
    opacity: STATIC_OPACITY,
  },
  bars: {
    width: '100%',
  },
  titleBar: {
    height: 14,
    width: '60%',
  },
  subtitleBar: {
    height: 12,
    width: '40%',
  },
});

export default SkeletonRow;
