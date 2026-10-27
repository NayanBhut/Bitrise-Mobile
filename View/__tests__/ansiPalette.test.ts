/**
 * @format
 */

import {describe, expect, it} from '@jest/globals';
import {
  AnsiColorKey,
  ANSER_RGB_TO_KEY,
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

describe('resolveAnsiFg', () => {
  it('resolves a recognized ANSI triple to the scheme palette value', () => {
    expect(resolveAnsiFg('85, 85, 85', 'dark', '#FFFFFF')).toBe(
      getAnsiPalette('dark')['bright-black'],
    );
    expect(resolveAnsiFg('85, 85, 85', 'light', '#000000')).toBe(
      getAnsiPalette('light')['bright-black'],
    );
  });

  it('falls back to the label color for null/empty/unknown foreground', () => {
    expect(resolveAnsiFg(null, 'dark', '#FFFFFF')).toBe('#FFFFFF');
    expect(resolveAnsiFg('', 'light', '#000000')).toBe('#000000');
    expect(resolveAnsiFg('12, 34, 56', 'dark', '#FFFFFF')).toBe('#FFFFFF');
  });
});
