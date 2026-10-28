import React from 'react';
import {useTheme} from '../Theme/useTheme';
import {BaseButton, ButtonProps} from './BaseButton';

/** Filled button for destructive actions (Abort, Log Out). */
export function DestructiveButton(props: ButtonProps) {
  const {colors} = useTheme();
  return (
    <BaseButton
      {...props}
      backgroundColor={colors.destructive}
      foregroundColor={colors.onFill}
    />
  );
}

export default DestructiveButton;
