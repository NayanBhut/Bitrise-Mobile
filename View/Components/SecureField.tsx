import React, {useState} from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {Pressable} from 'react-native';
import {useTheme} from '../Theme/useTheme';
import {AppIcon} from './AppIcon';

/**
 * Props the caller may set. The five security-critical props are intentionally
 * omitted from this type so callers cannot override them — they are hard-set
 * inside the component.
 */
export interface SecureFieldProps
  extends Omit<
    TextInputProps,
    | 'secureTextEntry'
    | 'autoComplete'
    | 'autoCorrect'
    | 'spellCheck'
    | 'importantForAutofill'
    | 'textContentType'
    | 'autoCapitalize'
  > {
  /** Accessibility label for the show/hide toggle. */
  toggleAccessibilityLabel?: string;
}

/**
 * A masked text field with an eye/eye.slash show-hide toggle. It centralizes
 * the app's secure-input requirement: autofill, autocomplete, autocorrect,
 * and spellcheck are always disabled and cannot be overridden by callers.
 */
export function SecureField({
  style,
  toggleAccessibilityLabel,
  ...rest
}: SecureFieldProps) {
  const {colors, spacing, type} = useTheme();
  const [visible, setVisible] = useState(false);

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: spacing.minTouchTarget,
    borderRadius: spacing.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    backgroundColor: colors.secondaryGroupedBackground,
    paddingHorizontal: spacing.spacing.md,
  };

  const inputStyle: TextStyle = {
    flex: 1,
    color: colors.label,
    paddingVertical: spacing.spacing.sm,
    fontSize: type.body.fontSize,
  };

  const toggleStyle: ViewStyle = {
    minWidth: spacing.minTouchTarget,
    minHeight: spacing.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <View style={[containerStyle, style as ViewStyle]}>
      <TextInput
        {...rest}
        style={inputStyle}
        placeholderTextColor={colors.tertiaryLabel}
        // Security-critical defaults — hard-set, not overridable by callers.
        secureTextEntry={!visible}
        autoComplete="off"
        autoCorrect={false}
        spellCheck={false}
        importantForAutofill="no"
        textContentType="none"
        autoCapitalize="none"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          toggleAccessibilityLabel ?? (visible ? 'Hide text' : 'Show text')
        }
        testID="secure-field-toggle"
        onPress={() => setVisible(previous => !previous)}
        style={toggleStyle}>
        <AppIcon name={visible ? 'hide' : 'show'} size={20} />
      </Pressable>
    </View>
  );
}

export default SecureField;
