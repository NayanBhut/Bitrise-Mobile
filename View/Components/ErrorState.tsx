import React from 'react';
import {StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle} from 'react-native';
import {useTheme} from '../Theme/useTheme';
import {AppIcon} from './AppIcon';
import {PrimaryButton} from './PrimaryButton';
import {SecondaryButton} from './SecondaryButton';

export interface ErrorStateProps {
  /**
   * The message to display. Callers always pass a sanitized
   * `getUserFacingError()` string; this component renders it verbatim and does
   * not inspect, format, or expose anything beyond it.
   */
  message: string;
  /** Retry handler wired to the Retry button. */
  onRetry: () => void;
  /** Retry button label. Defaults to `Retry`. */
  retryTitle?: string;
  /** Retry button style. Defaults to `primary`. */
  retryVariant?: 'primary' | 'secondary';
  /** Optional test identifier forwarded to the container. */
  testID?: string;
}

/**
 * Centered error-state placeholder: an error symbol, the sanitized message
 * passed in by the caller, and a Retry button (reusing the shared button
 * family). It renders only the provided message string.
 */
export function ErrorState({
  message,
  onRetry,
  retryTitle = 'Retry',
  retryVariant = 'primary',
  testID,
}: ErrorStateProps) {
  const {colors, type, spacing} = useTheme();

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    {padding: spacing.spacing.lg, maxWidth: spacing.maxContentWidth},
  ];

  const messageStyle: StyleProp<TextStyle> = [
    type.subheadline,
    styles.text,
    {color: colors.label, marginTop: spacing.spacing.md},
  ];
  const actionStyle: StyleProp<ViewStyle> = {marginTop: spacing.spacing.lg};

  return (
    <View style={containerStyle} testID={testID}>
      <AppIcon name="error" size={48} color={colors.statusFailed} />
      <Text style={messageStyle} allowFontScaling>
        {message}
      </Text>
      <View style={actionStyle}>
        {retryVariant === 'secondary' ? (
          <SecondaryButton title={retryTitle} onPress={onRetry} />
        ) : (
          <PrimaryButton title={retryTitle} onPress={onRetry} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  text: {
    textAlign: 'center',
  },
});

export default ErrorState;
