/**
 * @format
 */

import 'react-native';
import React from 'react';
import {expect, it, describe, jest, beforeEach} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {SFSymbolView} from 'react-native-nitro-sfsymbols';
import {AppIcon} from '../AppIcon';
import {icons} from '../../Theme/icons';

// Control reduceMotion per test. Prefixed with `mock` so jest.mock may use it.
let mockReduceMotion = false;
jest.mock('../../Theme/useTheme', () => ({
  useTheme: () => ({reduceMotion: mockReduceMotion}),
}));

function findByType(tree: renderer.ReactTestInstance, type: unknown) {
  return tree.findAllByType(type as any);
}

describe('AppIcon (iOS)', () => {
  beforeEach(() => {
    mockReduceMotion = false;
  });

  it('renders an SFSymbolView with the mapped iOS symbol name', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppIcon name="success" />);
    });

    const symbols = findByType(tree.root, SFSymbolView);
    expect(symbols).toHaveLength(1);
    expect(symbols[0].props.name).toBe(icons.success.ios);
  });

  it('applies a symbol effect when reduce motion is off', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppIcon name="running" effect="rotate" />);
    });

    const symbol = findByType(tree.root, SFSymbolView)[0];
    expect(symbol.props.animation).toEqual({type: 'rotate', repeating: true});
  });

  it('omits the effect when reduce motion is on', async () => {
    mockReduceMotion = true;
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppIcon name="running" effect="rotate" />);
    });

    const symbol = findByType(tree.root, SFSymbolView)[0];
    expect(symbol.props.animation).toBeUndefined();
  });
});
