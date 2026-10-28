/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text} from 'react-native';
import {expect, it, describe, jest, beforeEach} from '@jest/globals';
import {trigger} from 'react-native-haptic-feedback';
import renderer, {act} from 'react-test-renderer';
import {BaseButton} from '../BaseButton';

// The three public buttons (Primary/Secondary/Destructive) cover the happy
// path and the `loading` state. This suite covers BaseButton-specific behavior
// that the wrappers don't exercise directly: the `disabled` prop (distinct
// from `loading`) and the composed accessibilityState.
describe('BaseButton', () => {
  beforeEach(() => {
    (trigger as jest.Mock).mockClear();
  });

  it('renders the title', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <BaseButton title="Go" onPress={() => {}} foregroundColor="#FFFFFF" />,
      );
    });
    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('Go');
  });

  it('does not call onPress or fire a haptic when disabled', async () => {
    const onPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <BaseButton
          title="Go"
          onPress={onPress}
          foregroundColor="#FFFFFF"
          disabled
        />,
      );
    });
    const button = tree.root.findAllByProps({accessibilityRole: 'button'})[0];
    expect(button.props.accessibilityState).toEqual({disabled: true, busy: false});
    await act(async () => {
      button.props.onPress();
    });
    expect(onPress).not.toHaveBeenCalled();
    expect(trigger).not.toHaveBeenCalled();
  });

  it('marks the button busy while loading', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <BaseButton
          title="Go"
          onPress={() => {}}
          foregroundColor="#FFFFFF"
          loading
        />,
      );
    });
    const button = tree.root.findAllByProps({accessibilityRole: 'button'})[0];
    expect(button.props.accessibilityState).toEqual({disabled: true, busy: true});
  });
});
