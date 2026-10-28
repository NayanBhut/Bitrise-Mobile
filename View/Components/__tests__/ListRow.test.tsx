/**
 * @format
 */

import 'react-native';
import React from 'react';
import {expect, it, describe, jest} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {SFSymbol} from '@mythologi/react-native-sfsymbols';
import {ListRow} from '../ListRow';
import {icons} from '../../Theme/icons';

describe('ListRow', () => {
  it('composes a combined accessibility label from title and subtitle', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <ListRow title="Build 142" subtitle="main" onPress={() => {}} />,
      );
    });

    const row = tree.root.findAllByProps({accessibilityRole: 'button'})[0];
    expect(row.props.accessibilityLabel).toBe('Build 142, main');
  });

  it('shows a chevron accessory by default when pressable', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<ListRow title="Open" onPress={() => {}} />);
    });

    const symbols = tree.root
      .findAllByType(SFSymbol)
      .filter(s => s.props.name === icons.chevron.ios);
    expect(symbols).toHaveLength(1);
  });

  it('shows no chevron when not pressable', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<ListRow title="Static" />);
    });

    const symbols = tree.root
      .findAllByType(SFSymbol)
      .filter(s => s.props.name === icons.chevron.ios);
    expect(symbols).toHaveLength(0);
  });

  it('calls onPress when the row is pressed', async () => {
    const onPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<ListRow title="Tap me" onPress={onPress} />);
    });

    await act(async () => {
      tree.root.findAllByProps({accessibilityRole: 'button'})[0].props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('only takes the button role when pressable', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<ListRow title="Static" subtitle="no press" />);
    });

    expect(tree.root.findAllByProps({accessibilityRole: 'button'})).toHaveLength(
      0,
    );
    const accessible = tree.root.findAllByProps({accessible: true});
    expect(accessible.length).toBeGreaterThan(0);
    expect(accessible[0].props.accessibilityLabel).toBe('Static, no press');
  });
});
