import React from 'react';
import {StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle} from 'react-native';
import {useTheme} from '../Theme/useTheme';

export interface SectionCardProps {
  /** Optional grouped header title rendered above the card. */
  title?: string;
  /** Optional footnote rendered below the card. */
  footer?: string;
  /** Card content. */
  children: React.ReactNode;
  /** Optional style override merged onto the outer wrapper. */
  style?: StyleProp<ViewStyle>;
  /** Optional test identifier forwarded to the outer wrapper. */
  testID?: string;
}

/**
 * Inset-grouped container with an optional header title and footer. The card
 * body is a rounded `secondaryGroupedBackground` surface that holds its
 * children; width is constrained to a readable max for wide screens (iPad).
 */
export function SectionCard({title, footer, children, style, testID}: SectionCardProps) {
  const {colors, type, spacing} = useTheme();

  const wrapperStyle: StyleProp<ViewStyle> = [
    styles.wrapper,
    {maxWidth: spacing.maxContentWidth},
    style,
  ];

  const headerStyle: StyleProp<TextStyle> = [
    type.footnote,
    styles.header,
    {color: colors.secondaryLabel, marginBottom: spacing.spacing.xs},
  ];

  const cardStyle: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: colors.secondaryGroupedBackground,
      borderRadius: spacing.radius.lg,
      padding: spacing.spacing.md,
    },
  ];

  const footerStyle: StyleProp<TextStyle> = [
    type.footnote,
    styles.footer,
    {color: colors.tertiaryLabel, marginTop: spacing.spacing.xs},
  ];

  return (
    <View style={wrapperStyle} testID={testID}>
      {title != null ? <Text style={headerStyle}>{title}</Text> : null}
      <View style={cardStyle}>{children}</View>
      {footer != null ? <Text style={footerStyle}>{footer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    textTransform: 'uppercase',
  },
  card: {
    overflow: 'hidden',
  },
  footer: {},
});

export default SectionCard;
