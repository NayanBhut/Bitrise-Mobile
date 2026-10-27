/**
 * @format
 */

import 'react-native';
import React from 'react';
import {ActivityIndicator, Text} from 'react-native';
import {expect, it, describe, jest, beforeEach} from '@jest/globals';
import {trigger} from 'react-native-haptic-feedback';
import renderer, {act} from 'react-test-renderer';
import {DestructiveButton} from '../DestructiveButton';

describe('DestructiveButton', () => {
  beforeEach(() => {
    (trigger as jest.Mock).mockClear();
  });

  it('renders the title', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <DestructiveButton title="Log Out" onPress={() => {}} />,
      );
    });
    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('Log Out');
  });

  it('calls onPress and fires a haptic on press', async () => {
    const onPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <DestructiveButton title="Log Out" onPress={onPress} testID="btn" />,
      );
    });
    await act(async () => {
      tree.root.findAllByProps({accessibilityRole: 'button'})[0].props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveBeenCalledTimes(1);
  });

  it('shows a spinner and does not call onPress when loading', async () => {
    const onPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <DestructiveButton title="Log Out" onPress={onPress} loading testID="btn" />,
      );
    });
    expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(1);
    await act(async () => {
      tree.root.findAllByProps({accessibilityRole: 'button'})[0].props.onPress();
    });
    expect(onPress).not.toHaveBeenCalled();
  });
});
