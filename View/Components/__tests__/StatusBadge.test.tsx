/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text} from 'react-native';
import {expect, it, describe} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {SFSymbolView} from 'react-native-nitro-sfsymbols';
import {BuildState} from '../../../API Calls/BuildModel';
import {StatusBadge} from '../StatusBadge';
import {icons} from '../../Theme/icons';

const CASES: Array<{
  state: BuildState;
  icon: keyof typeof icons;
  label: string;
}> = [
  {state: BuildState.Success, icon: 'success', label: 'Success'},
  {state: BuildState.Failed, icon: 'failed', label: 'Failed'},
  {state: BuildState.Abort, icon: 'aborted', label: 'Aborted'},
  {state: BuildState.InProgress, icon: 'running', label: 'In Progress'},
  {state: BuildState.OnHold, icon: 'onHold', label: 'On Hold'},
];

describe('StatusBadge', () => {
  it.each(CASES)(
    'renders icon + text label for $label',
    async ({state, icon, label}) => {
      let tree!: renderer.ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<StatusBadge state={state} />);
      });

      // Icon present with the mapped SF Symbol name (never color alone).
      const symbol = tree.root.findAllByType(SFSymbolView);
      expect(symbol).toHaveLength(1);
      expect(symbol[0].props.name).toBe(icons[icon].ios);

      // Text label present.
      const texts = tree.root.findAllByType(Text);
      const labels = texts.map(t => t.props.children);
      expect(labels).toContain(label);
    },
  );

  it('animates only the in-progress state', async () => {
    let running!: renderer.ReactTestRenderer;
    let success!: renderer.ReactTestRenderer;
    await act(async () => {
      running = renderer.create(<StatusBadge state={BuildState.InProgress} />);
      success = renderer.create(<StatusBadge state={BuildState.Success} />);
    });

    expect(
      running.root.findAllByType(SFSymbolView)[0].props.animation,
    ).toBeDefined();
    expect(
      success.root.findAllByType(SFSymbolView)[0].props.animation,
    ).toBeUndefined();
  });
});
