/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text} from 'react-native';
import {expect, it, describe, jest} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {SFSymbol} from '@mythologi/react-native-sfsymbols';
import {ErrorState} from '../ErrorState';
import {icons} from '../../Theme/icons';

describe('ErrorState', () => {
  it('renders the passed message verbatim', async () => {
    const message = 'Something went wrong. Please try again.';
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<ErrorState message={message} onRetry={() => {}} />);
    });

    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain(message);
  });

  it('renders the error icon', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<ErrorState message="Oops" onRetry={() => {}} />);
    });

    const symbol = tree.root.findAllByType(SFSymbol);
    expect(symbol).toHaveLength(1);
    expect(symbol[0].props.name).toBe(icons.error.ios);
  });

  it('calls onRetry when the Retry button is pressed', async () => {
    const onRetry = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<ErrorState message="Oops" onRetry={onRetry} />);
    });

    await act(async () => {
      tree.root.findAllByProps({accessibilityRole: 'button'})[0].props.onPress();
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('defaults the retry label to Retry', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<ErrorState message="Oops" onRetry={() => {}} />);
    });

    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('Retry');
  });
});
