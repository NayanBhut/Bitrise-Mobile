import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {BuildState} from '../../API Calls/BuildModel';
import {IconName} from '../Theme/icons';
import {ColorToken, ThemeColors} from '../Theme/colors';
import {useTheme} from '../Theme/useTheme';
import {AppIcon} from './AppIcon';

interface StatusDescriptor {
  icon: IconName;
  colorToken: keyof Pick<
    ThemeColors,
    | 'statusSuccess'
    | 'statusFailed'
    | 'statusAborted'
    | 'statusInProgress'
    | 'statusOnHold'
  >;
  label: string;
}

/** Map each BuildState to its icon, color token, and human-readable label. */
const DESCRIPTORS: Record<BuildState, StatusDescriptor> = {
  [BuildState.Success]: {
    icon: 'success',
    colorToken: 'statusSuccess',
    label: 'Success',
  },
  [BuildState.Failed]: {
    icon: 'failed',
    colorToken: 'statusFailed',
    label: 'Failed',
  },
  [BuildState.Abort]: {
    icon: 'aborted',
    colorToken: 'statusAborted',
    label: 'Aborted',
  },
  [BuildState.InProgress]: {
    icon: 'running',
    colorToken: 'statusInProgress',
    label: 'In Progress',
  },
  [BuildState.OnHold]: {
    icon: 'onHold',
    colorToken: 'statusOnHold',
    label: 'On Hold',
  },
};

/**
 * Human-readable label for a build state, matching what {@link StatusBadge}
 * renders. Exposed so callers (e.g. combined accessibility labels) can speak
 * the same status text the badge shows.
 */
export function statusLabel(state: BuildState): string {
  return DESCRIPTORS[state]?.label ?? String(state);
}

/**
 * The running icon, continuously rotated in JS with react-native-reanimated.
 *
 * The iOS-13 `react-native-sfsymbols` library has no native symbol effects, so
 * the "running build" motion that previously used a native symbol animation is
 * now driven here in JS. The rotation is gated on Reduce Motion: when it is on
 * the icon renders statically. `AppIcon`'s `effect` prop is passed for
 * source-compatibility but is a documented no-op on the native symbol.
 */
function RunningIcon({size, color}: {size: number; color: ColorToken}) {
  const {reduceMotion} = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(rotation);
      rotation.value = 0;
      return;
    }
    rotation.value = withRepeat(
      withTiming(360, {duration: 1000, easing: Easing.linear}),
      -1,
      false,
    );
    return () => cancelAnimation(rotation);
  }, [reduceMotion, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.value}deg`}],
  }));

  return (
    <Animated.View style={reduceMotion ? undefined : animatedStyle}>
      <AppIcon name="running" size={size} color={color} effect="rotate" />
    </Animated.View>
  );
}

export interface StatusBadgeProps {
  /** Build state to represent. */
  state: BuildState;
  /** Icon point size. Default 16 to match adjacent text. */
  size?: number;
}

/**
 * Renders a build status as color + icon + text label together (never color
 * alone), satisfying the "no status by color alone" accessibility rule. The
 * in-progress state animates its symbol in JS (reanimated), gated on Reduce
 * Motion; all other states render a static icon.
 */
export function StatusBadge({state, size = 16}: StatusBadgeProps) {
  const {colors, type} = useTheme();
  const descriptor = DESCRIPTORS[state];
  const color = colors[descriptor.colorToken];

  return (
    <View style={styles.container} accessibilityLabel={descriptor.label}>
      {state === BuildState.InProgress ? (
        <RunningIcon size={size} color={color} />
      ) : (
        <AppIcon name={descriptor.icon} size={size} color={color} />
      )}
      <Text style={[type.subheadline, styles.label, {color}]}>
        {descriptor.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginLeft: 6,
  },
});

export default StatusBadge;
