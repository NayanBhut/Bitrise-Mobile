import React from 'react';
import {useTheme} from '../Theme/useTheme';
import {BaseButton, ButtonProps} from './BaseButton';

/** Prominent filled button using the accent color. */
export function PrimaryButton(props: ButtonProps) {
  const {colors} = useTheme();
  return (
    <BaseButton
      {...props}
      backgroundColor={colors.accent}
      foregroundColor={colors.onFill}
    />
  );
}

export default PrimaryButton;
