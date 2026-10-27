/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text} from 'react-native';
import {expect, it, describe} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {SectionCard} from '../SectionCard';

describe('SectionCard', () => {
  it('renders the header title when provided', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <SectionCard title="Account">
          <Text>body</Text>
        </SectionCard>,
      );
    });

    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('Account');
  });

  it('renders its children', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <SectionCard>
          <Text testID="child">hello</Text>
        </SectionCard>,
      );
    });

    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('hello');
  });

  it('renders the footer when provided', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <SectionCard footer="Footnote text">
          <Text>body</Text>
        </SectionCard>,
      );
    });

    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('Footnote text');
  });
});
