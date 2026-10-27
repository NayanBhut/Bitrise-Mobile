/**
 * @format
 */

import 'react-native';
import React from 'react';
import {expect, it, describe, jest, beforeEach} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {SkeletonRow} from '../SkeletonRow';

// Control reduceMotion per test. Prefixed with `mock` so jest.mock may use it.
let mockReduceMotion = false;
jest.mock('../../Theme/useTheme', () => ({
  useTheme: () => ({
    colors: {
      secondaryGroupedBackground: '#1C1C1E',
      fill: '#2C2C2E',
    },
    spacing: require('../../Theme/spacing'),
    type: require('../../Theme/typography'),
    reduceMotion: mockReduceMotion,
  }),
}));

describe('SkeletonRow', () => {
  beforeEach(() => {
    mockReduceMotion = false;
  });

  // `findAllByProps` matches both the host node and its composite instance, so
  // count distinct host elements (those with a string `type`) for exactness.
  const countHosts = (tree: renderer.ReactTestRenderer, testID: string) =>
    tree.root
      .findAllByProps({testID})
      .filter(node => typeof node.type === 'string').length;

  it('renders an animated placeholder when reduce motion is off', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<SkeletonRow />);
    });

    expect(countHosts(tree, 'skeleton-animated')).toBe(1);
    expect(countHosts(tree, 'skeleton-static')).toBe(0);
    expect(countHosts(tree, 'skeleton-bar')).toBeGreaterThan(0);
  });

  it('renders a static placeholder when reduce motion is on', async () => {
    mockReduceMotion = true;
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<SkeletonRow />);
    });

    expect(countHosts(tree, 'skeleton-static')).toBe(1);
    expect(countHosts(tree, 'skeleton-animated')).toBe(0);
    expect(countHosts(tree, 'skeleton-bar')).toBeGreaterThan(0);
  });

  it('renders a single bar when lines is 1', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<SkeletonRow lines={1} />);
    });

    expect(countHosts(tree, 'skeleton-bar')).toBe(1);
  });
});
