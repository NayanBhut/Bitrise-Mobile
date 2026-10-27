import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import RNHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';
import {ColorToken} from '../Theme/colors';
import {useTheme} from '../Theme/useTheme';

export interface ButtonProps {
  /** Button label. */
  title: string;
  /** Press handler. Not called while loading or disabled. */
  onPress: () => void;
  /** Shows a spinner and blocks presses. */
  loading?: boolean;
  /** Disables the button. */
  disabled?: boolean;
  /** Optional accessibility hint. */
  accessibilityHint?: string;
  /** Optional test identifier forwarded to the pressable. */
  testID?: string;
}

interface BaseButtonProps extends ButtonProps {
  /** Background fill color (undefined = transparent/bordered). */
  backgroundColor?: ColorToken;
  /** Label / spinner color. */
  foregroundColor: ColorToken;
  /** Optional border color (secondary style). */
  borderColor?: ColorToken;
  /** Test identifier on the pressable. */
  testID?: string;
}

/**
 * Shared button implementation. Enforces a >=44pt touch target, a loading
 * spinner, and a light-impact haptic on press (no-op where unsupported).
 */
export function BaseButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  accessibilityHint,
  backgroundColor,
  foregroundColor,
  borderColor,
  testID,
}: BaseButtonProps) {
  const {spacing} = useTheme();
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) {
      return;
    }
    RNHapticFeedback.trigger(HapticFeedbackTypes.impactLight, {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    onPress();
  };

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    {
      minHeight: spacing.minTouchTarget,
      borderRadius: spacing.radius.md,
      paddingHorizontal: spacing.spacing.md,
      backgroundColor,
    },
    borderColor ? {borderWidth: StyleSheet.hairlineWidth * 2, borderColor} : null,
    isDisabled ? styles.disabled : null,
  ];

  const labelStyle: StyleProp<TextStyle> = [styles.label, {color: foregroundColor}];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{disabled: isDisabled, busy: loading}}
      accessibilityHint={accessibilityHint}
      disabled={isDisabled}
      onPress={handlePress}
      style={containerStyle}>
      {loading ? (
        <ActivityIndicator color={foregroundColor} />
      ) : (
        <View style={styles.content}>
          <Text style={labelStyle} allowFontScaling numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
});
