import React from 'react';
import {StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle} from 'react-native';
import {IconName} from '../Theme/icons';
import {useTheme} from '../Theme/useTheme';
import {AppIcon} from './AppIcon';
import {PrimaryButton} from './PrimaryButton';
import {SecondaryButton} from './SecondaryButton';

export interface EmptyStateProps {
  /** Icon to show. Defaults to the `empty` symbol. */
  icon?: IconName;
  /** Headline describing the empty state. */
  title: string;
  /** Optional supporting message. */
  message?: string;
  /** Optional action button label. Requires `onAction` to render. */
  actionTitle?: string;
  /** Optional action handler. Requires `actionTitle` to render. */
  onAction?: () => void;
  /** Action button style. Defaults to `secondary`. */
  actionVariant?: 'primary' | 'secondary';
  /** Optional test identifier forwarded to the container. */
  testID?: string;
}

/**
 * Centered empty-state placeholder: a symbol, a title, an optional message,
 * and an optional action button (reusing the shared button family).
 */
export function EmptyState({
  icon = 'empty',
  title,
  message,
  actionTitle,
  onAction,
  actionVariant = 'secondary',
  testID,
}: EmptyStateProps) {
  const {colors, type, spacing} = useTheme();
  const secondaryLabel = colors.secondaryLabel;

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    {padding: spacing.spacing.lg, maxWidth: spacing.maxContentWidth},
  ];

  const titleStyle: StyleProp<TextStyle> = [
    type.title2,
    styles.text,
    {color: colors.label, marginTop: spacing.spacing.md},
  ];
  const messageStyle: StyleProp<TextStyle> = [
    type.subheadline,
    styles.text,
    {color: colors.secondaryLabel, marginTop: spacing.spacing.sm},
  ];
  const actionStyle: StyleProp<ViewStyle> = {marginTop: spacing.spacing.lg};

  const showAction = actionTitle != null && onAction != null;

  return (
    <View style={containerStyle} testID={testID}>
      <AppIcon
        name={icon}
        size={48}
        color={typeof secondaryLabel === 'string' ? secondaryLabel : undefined}
      />
      <Text style={titleStyle} allowFontScaling>
        {title}
      </Text>
      {message != null ? (
        <Text style={messageStyle} allowFontScaling>
          {message}
        </Text>
      ) : null}
      {showAction ? (
        <View style={actionStyle}>
          {actionVariant === 'primary' ? (
            <PrimaryButton title={actionTitle} onPress={onAction} />
          ) : (
            <SecondaryButton title={actionTitle} onPress={onAction} />
          )}
        </View>
      ) : null}
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

export default EmptyState;
