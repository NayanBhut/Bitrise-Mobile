import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {IconName} from '../Theme/icons';
import {useTheme} from '../Theme/useTheme';
import {AppIcon} from './AppIcon';

export interface ListRowProps {
  /** Primary row text. */
  title: string;
  /** Optional secondary text below the title. */
  subtitle?: string;
  /** Optional leading icon rendered before the title (decorative). */
  leadingIcon?: IconName;
  /** Custom trailing accessory; overrides the default chevron. */
  accessory?: React.ReactNode;
  /** Press handler. When set the row becomes a button and shows a chevron. */
  onPress?: () => void;
  /** Optional accessibility hint forwarded to the row. */
  accessibilityHint?: string;
  /** Optional test identifier forwarded to the row. */
  testID?: string;
  /** Optional style override merged onto the row container. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Inset-grouped row with an optional leading icon, a title, an optional
 * subtitle, and a trailing accessory (a disclosure chevron by default when the
 * row is pressable). The row reads as a single accessibility element with a
 * combined label, and takes the `button` role only when pressable.
 */
export function ListRow({
  title,
  subtitle,
  leadingIcon,
  accessory,
  onPress,
  accessibilityHint,
  testID,
  style,
}: ListRowProps) {
  const {colors, type, spacing} = useTheme();
  const pressable = onPress != null;
  const combinedLabel = subtitle ? `${title}, ${subtitle}` : title;
  const tertiary = colors.tertiaryLabel;

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

  const titleStyle: StyleProp<TextStyle> = [type.body, {color: colors.label}];
  const subtitleStyle: StyleProp<TextStyle> = [
    type.footnote,
    {color: colors.secondaryLabel, marginTop: spacing.spacing.xs},
  ];
  const leadingStyle: StyleProp<ViewStyle> = {marginRight: spacing.spacing.md};
  const accessoryStyle: StyleProp<ViewStyle> = {marginLeft: spacing.spacing.sm};

  const trailing = accessory ?? (
    pressable ? (
      <AppIcon
        name="chevron"
        size={16}
        color={typeof tertiary === 'string' ? tertiary : undefined}
      />
    ) : null
  );

  const content = (
    <>
      {leadingIcon ? (
        <View style={leadingStyle}>
          <AppIcon name={leadingIcon} size={22} />
        </View>
      ) : null}
      <View style={styles.center}>
        <Text style={titleStyle} allowFontScaling>
          {title}
        </Text>
        {subtitle ? (
          <Text style={subtitleStyle} allowFontScaling>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={accessoryStyle}>{trailing}</View> : null}
    </>
  );

  if (pressable) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessible
        accessibilityRole="button"
        accessibilityLabel={combinedLabel}
        accessibilityHint={accessibilityHint}
        style={containerStyle}>
        {content}
      </Pressable>
    );
  }

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={combinedLabel}
      accessibilityHint={accessibilityHint}
      style={containerStyle}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    flex: 1,
  },
});

export default ListRow;
