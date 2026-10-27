/**
 * @format
 */

import 'react-native';
import React from 'react';
import {ActivityIndicator, Text} from 'react-native';
import {expect, it, describe, jest, beforeEach} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {trigger} from 'react-native-haptic-feedback';
import {PrimaryButton} from '../PrimaryButton';

describe('PrimaryButton', () => {
  beforeEach(() => {
    (trigger as jest.Mock).mockClear();
  });

  it('renders the title', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<PrimaryButton title="Sign In" onPress={() => {}} />);
    });
    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('Sign In');
  });

  it('calls onPress and fires a haptic on press', async () => {
    const onPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <PrimaryButton title="Sign In" onPress={onPress} testID="btn" />,
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
        <PrimaryButton title="Sign In" onPress={onPress} loading testID="btn" />,
      );
    });
    expect(tree.root.findAllByType(ActivityIndicator)).toHaveLength(1);
    await act(async () => {
      tree.root.findAllByProps({accessibilityRole: 'button'})[0].props.onPress();
    });
    expect(onPress).not.toHaveBeenCalled();
  });
});
