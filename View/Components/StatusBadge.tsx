import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {BuildState} from '../../API Calls/BuildModel';
import {IconName} from '../Theme/icons';
import {ThemeColors} from '../Theme/colors';
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

export interface StatusBadgeProps {
  /** Build state to represent. */
  state: BuildState;
  /** Icon point size. Default 16 to match adjacent text. */
  size?: number;
}

/**
 * Renders a build status as color + icon + text label together (never color
 * alone), satisfying the "no status by color alone" accessibility rule. The
 * in-progress state animates its symbol, gated on Reduce Motion inside AppIcon.
 */
export function StatusBadge({state, size = 16}: StatusBadgeProps) {
  const {colors, type} = useTheme();
  const descriptor = DESCRIPTORS[state];
  const color = colors[descriptor.colorToken];

  return (
    <View style={styles.container} accessibilityLabel={descriptor.label}>
      <AppIcon
        name={descriptor.icon}
        size={size}
        color={typeof color === 'string' ? color : undefined}
        effect={state === BuildState.InProgress ? 'rotate' : undefined}
      />
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
