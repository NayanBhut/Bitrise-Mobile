/**
 * @format
 */

import 'react-native';
import React from 'react';
import * as ReactNative from 'react-native';
import {Platform, Text} from 'react-native';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {AnsiText} from '../AnsiText';
import {getAnsiPalette} from '../ansiPalette';
import {getColors} from '../Theme/colors';

// Force the Android palette (string color tokens) so we can assert concrete
// color strings. On iOS the tokens are OpaqueColorValues and not comparable.
const originalOS = Platform.OS;
beforeEach(() => {
  Platform.OS = 'android';
});
afterEach(() => {
  Platform.OS = originalOS;
  jest.restoreAllMocks();
});

/** ANSI SGR escape for the given code around the text `X`. */
function sgr(code: number): string {
  return `\u001b[${code}mX\u001b[0m`;
}

/** Collect the leaf <Text> style color for the single rendered entry. */
function firstEntryColor(tree: renderer.ReactTestRenderer): unknown {
  const texts = tree.root.findAllByType(Text);
  // The inner-most Text (the entry) is the last leaf carrying the content.
  const leaf = texts.find(t => t.props.children === 'X');
  const style = leaf?.props.style ?? {};
  return style.color;
}

function mockScheme(scheme: 'light' | 'dark') {
  jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(scheme);
}

describe('AnsiText theme-aware palette', () => {
  it('maps bright-black to the light palette value in light mode', () => {
    mockScheme('light');
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      // Code 90 = bright-black.
      tree = renderer.create(<AnsiText ansi={sgr(90)} />);
    });
    expect(firstEntryColor(tree)).toBe(getAnsiPalette('light')['bright-black']);
  });

  it('maps bright-black to the dark palette value in dark mode', () => {
    mockScheme('dark');
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<AnsiText ansi={sgr(90)} />);
    });
    expect(firstEntryColor(tree)).toBe(getAnsiPalette('dark')['bright-black']);
  });

  it('resolves different bright-black values between light and dark', () => {
    expect(getAnsiPalette('light')['bright-black']).not.toBe(
      getAnsiPalette('dark')['bright-black'],
    );
  });

  it('default foreground (no ANSI color) follows the theme label color', () => {
    mockScheme('dark');
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<AnsiText ansi={'plain'} />);
    });
    const texts = tree.root.findAllByType(Text);
    const leaf = texts.find(t => t.props.children === 'plain');
    expect(leaf?.props.style.color).toBe(getColors('dark').label);
  });

  it('preserves bold and dim decorations', () => {
    mockScheme('dark');
    let boldTree!: renderer.ReactTestRenderer;
    act(() => {
      // Code 1 = bold.
      boldTree = renderer.create(<AnsiText ansi={`\u001b[1mX\u001b[0m`} />);
    });
    const boldLeaf = boldTree.root
      .findAllByType(Text)
      .find(t => t.props.children === 'X');
    expect(boldLeaf?.props.style.fontWeight).toBe('bold');

    let dimTree!: renderer.ReactTestRenderer;
    act(() => {
      // Code 2 = dim.
      dimTree = renderer.create(<AnsiText ansi={`\u001b[2mX\u001b[0m`} />);
    });
    const dimLeaf = dimTree.root
      .findAllByType(Text)
      .find(t => t.props.children === 'X');
    expect(dimLeaf?.props.style.opacity).toBe(0.5);
  });

  it('renders selectable text by default', () => {
    mockScheme('light');
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<AnsiText ansi={'line'} />);
    });
    const anySelectable = tree.root
      .findAllByType(Text)
      .some(t => t.props.selectable === true);
    expect(anySelectable).toBe(true);
  });
});
