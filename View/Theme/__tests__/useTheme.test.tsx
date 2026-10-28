/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Platform, Text} from 'react-native';
import {afterAll, beforeAll, expect, it, describe} from '@jest/globals';
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
  'link',
  'statusSuccess',
  'statusFailed',
  'statusInProgress',
  'statusOnHold',
  'statusAborted',
  'destructive',
  'onFill',
];

/** Relative luminance per WCAG 2.x for a #RRGGBB hex string. */
function relativeLuminance(hex: string): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two #RRGGBB hex strings. */
function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

describe('getColors', () => {
  it('defines every semantic token for both schemes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const colors = getColors(scheme);
      for (const key of COLOR_KEYS) {
        expect(colors[key]).toBeDefined();
      }
    }
  });

  // The Android light palette uses raw hex literals (iOS resolves via
  // PlatformColor objects, which carry Apple's own contrast guarantees and are
  // not hex-checkable here). These two tokens were darkened for AA body
  // contrast on the grouped surface #F2F2F7; lock that in.
  describe('Android light body-text contrast (F-5, F-6 regression)', () => {
    const GROUPED = '#F2F2F7';
    const originalOS = Platform.OS;

    // Force the Android palette so getColors returns hex literals (on iOS the
    // tokens are PlatformColor objects whose contrast Apple guarantees).
    beforeAll(() => {
      Platform.OS = 'android';
    });
    afterAll(() => {
      Platform.OS = originalOS;
    });

    it('keeps link at or above AA (4.5:1) on grouped #F2F2F7', () => {
      const colors = getColors('light');
      expect(typeof colors.link).toBe('string');
      expect(contrastRatio(colors.link as string, GROUPED)).toBeGreaterThanOrEqual(
        4.5,
      );
    });

    it('keeps statusOnHold at or above AA (4.5:1) on grouped #F2F2F7', () => {
      const colors = getColors('light');
      expect(typeof colors.statusOnHold).toBe('string');
      expect(
        contrastRatio(colors.statusOnHold as string, GROUPED),
      ).toBeGreaterThanOrEqual(4.5);
    });
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
