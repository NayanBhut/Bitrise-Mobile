/**
 * @format
 */

import {describe, expect, it} from '@jest/globals';
import {
  AnsiColorKey,
  ANSER_RGB_TO_KEY,
  ansiKeyForFg,
  getAnsiPalette,
  normalizeRgb,
  resolveAnsiFg,
} from '../ansiPalette';

const ALL_KEYS: AnsiColorKey[] = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'bright-black',
  'bright-red',
  'bright-green',
  'bright-yellow',
  'bright-blue',
  'bright-magenta',
  'bright-cyan',
  'bright-white',
];

describe('normalizeRgb', () => {
  it('collapses inconsistent spacing to a single key', () => {
    expect(normalizeRgb('255, 255, 255')).toBe(normalizeRgb('255,255,255'));
    expect(normalizeRgb('85, 85, 85')).toBe('85,85,85');
  });
});

describe('ANSER_RGB_TO_KEY', () => {
  it('maps anser bright-black triple to the bright-black key', () => {
    expect(ANSER_RGB_TO_KEY[normalizeRgb('85, 85, 85')]).toBe('bright-black');
  });

  it('maps anser standard red triple to the red key', () => {
    expect(ANSER_RGB_TO_KEY[normalizeRgb('187, 0, 0')]).toBe('red');
  });
});

describe('ansiKeyForFg', () => {
  // anser emits "255,255,255" (no spaces) for white (code 37) and
  // "255, 255, 255" (with spaces) for bright-white (code 97). The exact-string
  // lookup keeps them distinct so bright-white is reachable at runtime.
  it('distinguishes white from bright-white by anser\u2019s exact spacing', () => {
    expect(ansiKeyForFg('255,255,255')).toBe('white');
    expect(ansiKeyForFg('255, 255, 255')).toBe('bright-white');
  });

  it('resolves the other 14 colors regardless of spacing', () => {
    expect(ansiKeyForFg('85, 85, 85')).toBe('bright-black');
    expect(ansiKeyForFg('187, 0, 0')).toBe('red');
    expect(ansiKeyForFg('0,187,0')).toBe('green');
  });

  it('returns null for an unrecognized foreground', () => {
    expect(ansiKeyForFg('12, 34, 56')).toBeNull();
  });
});

describe('getAnsiPalette', () => {
  it('defines every ANSI key in both schemes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const palette = getAnsiPalette(scheme);
      for (const key of ALL_KEYS) {
        expect(typeof palette[key]).toBe('string');
        expect(palette[key].length).toBeGreaterThan(0);
      }
    }
  });

  it('tunes bright-black differently for light vs dark so dim text stays visible', () => {
    expect(getAnsiPalette('light')['bright-black']).not.toBe(
      getAnsiPalette('dark')['bright-black'],
    );
  });
});

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

describe('light ANSI palette contrast (F-7 regression)', () => {
  // Light log surface is the grouped background #F2F2F7 (Android light). Every
  // ANSI color is used as body-size (13pt footnote) mono log text, so each
  // must clear the WCAG AA 4.5:1 body threshold on that surface.
  const LIGHT_SURFACE = '#F2F2F7';

  it('keeps every light-mode ANSI color at or above AA (4.5:1) on #F2F2F7', () => {
    const palette = getAnsiPalette('light');
    for (const key of ALL_KEYS) {
      const ratio = contrastRatio(palette[key], LIGHT_SURFACE);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('resolveAnsiFg', () => {
  it('resolves a recognized ANSI triple to the scheme palette value', () => {
    expect(resolveAnsiFg('85, 85, 85', 'dark', '#FFFFFF')).toBe(
      getAnsiPalette('dark')['bright-black'],
    );
    expect(resolveAnsiFg('85, 85, 85', 'light', '#000000')).toBe(
      getAnsiPalette('light')['bright-black'],
    );
  });

  it('resolves white and bright-white to their own (distinct) palette values', () => {
    expect(resolveAnsiFg('255,255,255', 'light', '#000000')).toBe(
      getAnsiPalette('light').white,
    );
    expect(resolveAnsiFg('255, 255, 255', 'light', '#000000')).toBe(
      getAnsiPalette('light')['bright-white'],
    );
    expect(getAnsiPalette('light').white).not.toBe(
      getAnsiPalette('light')['bright-white'],
    );
  });

  it('falls back to the label color for null/empty/unknown foreground', () => {
    expect(resolveAnsiFg(null, 'dark', '#FFFFFF')).toBe('#FFFFFF');
    expect(resolveAnsiFg('', 'light', '#000000')).toBe('#000000');
    expect(resolveAnsiFg('12, 34, 56', 'dark', '#FFFFFF')).toBe('#FFFFFF');
  });
});
