import React from 'react';
import {useTheme} from '../Theme/useTheme';
import {BaseButton, ButtonProps} from './BaseButton';

/** Tinted / bordered button for secondary actions. */
export function SecondaryButton(props: ButtonProps) {
  const {colors} = useTheme();
  return (
    <BaseButton
      {...props}
      backgroundColor={colors.fill}
      foregroundColor={colors.accent}
      borderColor={colors.separator}
    />
  );
}

export default SecondaryButton;
