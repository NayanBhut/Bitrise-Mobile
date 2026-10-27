/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text} from 'react-native';
import {expect, it, describe, jest} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {SFSymbolView} from 'react-native-nitro-sfsymbols';
import {EmptyState} from '../EmptyState';
import {icons} from '../../Theme/icons';

describe('EmptyState', () => {
  it('renders the title and message', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <EmptyState title="No apps" message="Pull to refresh" />,
      );
    });

    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('No apps');
    expect(labels).toContain('Pull to refresh');
  });

  it('uses the empty icon by default', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<EmptyState title="No apps" />);
    });

    const symbol = tree.root.findAllByType(SFSymbolView);
    expect(symbol).toHaveLength(1);
    expect(symbol[0].props.name).toBe(icons.empty.ios);
  });

  it('renders an action button that invokes onAction', async () => {
    const onAction = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <EmptyState title="No apps" actionTitle="Reload" onAction={onAction} />,
      );
    });

    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('Reload');

    await act(async () => {
      tree.root.findAllByProps({accessibilityRole: 'button'})[0].props.onPress();
    });
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders no action button when action props are omitted', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<EmptyState title="No apps" />);
    });

    expect(tree.root.findAllByProps({accessibilityRole: 'button'})).toHaveLength(
      0,
    );
  });
});
