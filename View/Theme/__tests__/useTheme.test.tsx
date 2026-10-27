/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text} from 'react-native';
import {expect, it, describe} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {getColors, ThemeColors} from '../colors';
import {Theme, useTheme} from '../useTheme';

const COLOR_KEYS: Array<keyof ThemeColors> = [
  'background',
  'secondaryBackground',
  'groupedBackground',
  'secondaryGroupedBackground',
  'label',
  'secondaryLabel',
  'tertiaryLabel',
  'separator',
  'fill',
  'accent',
  'statusSuccess',
  'statusFailed',
  'statusInProgress',
  'statusOnHold',
  'statusAborted',
  'destructive',
  'onFill',
];

describe('getColors', () => {
  it('defines every semantic token for both schemes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const colors = getColors(scheme);
      for (const key of COLOR_KEYS) {
        expect(colors[key]).toBeDefined();
      }
    }
  });
});

describe('useTheme', () => {
  it('returns colors, type, spacing, scheme and accessibility flags', async () => {
    let captured: Theme | undefined;

    const Probe = () => {
      captured = useTheme();
      return <Text>theme</Text>;
    };

    await act(async () => {
      renderer.create(<Probe />);
    });

    expect(captured).toBeDefined();
    const theme = captured as Theme;

    for (const key of COLOR_KEYS) {
      expect(theme.colors[key]).toBeDefined();
    }
    expect(theme.type).toBeDefined();
    expect(theme.type.mono).toBeDefined();
    expect(theme.spacing.minTouchTarget).toBe(44);
    expect(['light', 'dark']).toContain(theme.scheme);
    expect(typeof theme.reduceMotion).toBe('boolean');
    expect(typeof theme.boldText).toBe('boolean');
  });
});
