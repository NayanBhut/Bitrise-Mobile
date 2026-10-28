/**
 * @format
 */

import 'react-native';
import React from 'react';
import {expect, it, describe} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {SFSymbol} from '@mythologi/react-native-sfsymbols';
import {AppIcon} from '../AppIcon';
import {icons} from '../../Theme/icons';

function findByType(tree: renderer.ReactTestInstance, type: unknown) {
  return tree.findAllByType(type as any);
}

describe('AppIcon (iOS)', () => {
  it('renders an SFSymbol with the mapped iOS symbol name', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppIcon name="success" />);
    });

    const symbols = findByType(tree.root, SFSymbol);
    expect(symbols).toHaveLength(1);
    expect(symbols[0].props.name).toBe(icons.success.ios);
  });

  it('accepts an effect prop without forwarding a native animation', async () => {
    // The iOS-13 react-native-sfsymbols library has no native symbol effects,
    // so `effect` is accepted for source-compatibility but must not be
    // forwarded to the native symbol. Running-build motion is driven in JS by
    // StatusBadge instead.
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppIcon name="running" effect="rotate" />);
    });

    const symbol = findByType(tree.root, SFSymbol)[0];
    expect(symbol.props.animation).toBeUndefined();
    expect(symbol.props.effect).toBeUndefined();
    expect(symbol.props.name).toBe(icons.running.ios);
  });

  it('applies a hex string color as the tint', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppIcon name="error" color="#FF3B30" />);
    });

    const symbol = findByType(tree.root, SFSymbol)[0];
    expect(symbol.props.color).toBe('#FF3B30');
  });

  it('omits a non-string (PlatformColor) token so the symbol keeps the dynamic system tint', async () => {
    // A PlatformColor token is an OpaqueColorValue object, not a hex string;
    // we forward undefined and let the symbol fall back to the dynamic system
    // label color.
    const opaqueToken = {semantic: ['label']} as unknown as string;
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<AppIcon name="error" color={opaqueToken} />);
    });

    const symbol = findByType(tree.root, SFSymbol)[0];
    expect(symbol.props.color).toBeUndefined();
  });
});
