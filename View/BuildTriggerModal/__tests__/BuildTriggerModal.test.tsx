/**
 * @format
 */

import 'react-native';
import React from 'react';
import {TextInput} from 'react-native';
import {beforeEach, describe, expect, it, jest} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';

jest.mock('../../../API Calls/TokenStorage', () => ({
  getToken: jest.fn().mockResolvedValue('tok'),
  saveToken: jest.fn().mockResolvedValue(undefined),
  clearToken: jest.fn().mockResolvedValue(undefined),
}));

// Capture the post spy via a module-level holder so tests can read call args,
// mirroring BuildLists.test.tsx. The `mock` prefix lets the factory close over
// it (jest convention).
const mockPost = jest.fn().mockResolvedValue({status: 'ok'});

jest.mock('../../../API Calls/APIService', () => ({
  __esModule: true,
  default: class {
    post = (...args: unknown[]) => mockPost(...args);
  },
}));

import BuildTriggerModal from '../BuildTriggerModal';

type Props = React.ComponentProps<typeof BuildTriggerModal>;

function baseProps(overrides: Partial<Props> = {}): Props {
  return {
    slug: 'app-slug',
    visible: true,
    isAbortVisible: false,
    abortBuild: jest.fn(),
    cancel: jest.fn(),
    ...overrides,
  };
}

function setInput(tree: renderer.ReactTestRenderer, testID: string, text: string) {
  const input = tree.root.findByProps({testID}).findByType(TextInput);
  act(() => {
    input.props.onChangeText(text);
  });
}

function findText(tree: renderer.ReactTestRenderer, testID: string): string {
  const input = tree.root.findByProps({testID}).findByType(TextInput);
  return input.props.value;
}

// Count distinct reveal-toggle rows (testID starts with the prefix). testIDs
// propagate to several nodes per Pressable, so dedupe on the testID value.
function countRevealToggles(tree: renderer.ReactTestRenderer): number {
  const ids = new Set<string>();
  tree.root
    .findAll(
      node =>
        typeof node.props.testID === 'string' &&
        node.props.testID.startsWith('reveal-toggle-'),
    )
    .forEach(node => ids.add(node.props.testID));
  return ids.size;
}

// The accessibilityState lives on the Pressable rendered by BaseButton.
function startBuildDisabled(tree: renderer.ReactTestRenderer): boolean {
  const node = tree.root.find(
    n =>
      n.props.testID === 'start-build-button' &&
      n.props.accessibilityState != null,
  );
  return node.props.accessibilityState.disabled;
}

describe('BuildTriggerModal', () => {
  beforeEach(() => {
    mockPost.mockClear();
    mockPost.mockResolvedValue({status: 'ok'});
  });

  it('wipes secret state when the modal closes (visible true -> false)', async () => {
    const props = baseProps();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<BuildTriggerModal {...props} />);
    });

    setInput(tree, 'branch-input', 'feature/x');
    setInput(tree, 'env-key-name-input', 'API_URL');
    setInput(tree, 'env-key-value', 'https://x');
    act(() => {
      tree.root.findByProps({testID: 'add-env-button'}).props.onPress();
    });

    expect(findText(tree, 'branch-input')).toBe('feature/x');
    // Row exists now.
    expect(countRevealToggles(tree)).toBe(1);

    // Close -> should trigger the wipe on the true->false transition.
    await act(async () => {
      tree.update(<BuildTriggerModal {...baseProps({visible: false})} />);
    });
    // Re-open.
    await act(async () => {
      tree.update(<BuildTriggerModal {...baseProps({visible: true})} />);
    });

    expect(findText(tree, 'branch-input')).toBe('');
    expect(countRevealToggles(tree)).toBe(0);
  });

  it('masks env values by default and toggles reveal', async () => {
    const props = baseProps();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<BuildTriggerModal {...props} />);
    });

    setInput(tree, 'env-key-name-input', 'API_URL');
    setInput(tree, 'env-key-value', 'https://secret');
    act(() => {
      tree.root.findByProps({testID: 'add-env-button'}).props.onPress();
    });

    const toggle = tree.root.find(
      node =>
        typeof node.props.testID === 'string' &&
        node.props.testID.startsWith('reveal-toggle-') &&
        typeof node.props.onPress === 'function',
    );

    // Masked by default.
    expect(JSON.stringify(tree.toJSON())).toContain('••••••••');
    expect(JSON.stringify(tree.toJSON())).not.toContain('https://secret');

    // Reveal.
    act(() => {
      toggle.props.onPress();
    });
    expect(JSON.stringify(tree.toJSON())).toContain('https://secret');

    // Hide again.
    act(() => {
      toggle.props.onPress();
    });
    expect(JSON.stringify(tree.toJSON())).not.toContain('https://secret');
    expect(JSON.stringify(tree.toJSON())).toContain('••••••••');
  });

  it('disables Start Build until branch and workflow are non-empty', async () => {
    const props = baseProps();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<BuildTriggerModal {...props} />);
    });

    expect(startBuildDisabled(tree)).toBe(true);

    setInput(tree, 'branch-input', 'main');
    expect(startBuildDisabled(tree)).toBe(true);

    setInput(tree, 'workflow-input', 'primary');
    expect(startBuildDisabled(tree)).toBe(false);
  });

  it('sends the unchanged trigger payload, url, and headers', async () => {
    const props = baseProps();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<BuildTriggerModal {...props} />);
    });

    setInput(tree, 'branch-input', 'main');
    setInput(tree, 'workflow-input', 'primary');
    setInput(tree, 'env-key-name-input', 'API_URL');
    setInput(tree, 'env-key-value', 'https://x');
    act(() => {
      tree.root.findByProps({testID: 'add-env-button'}).props.onPress();
    });

    await act(async () => {
      tree.root.findByProps({testID: 'start-build-button'}).props.onPress();
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    const [url, body, headers] = mockPost.mock.calls[0] as [
      string,
      unknown,
      Record<string, string>,
    ];
    expect(url).toBe('apps/app-slug/builds');
    expect(body).toEqual({
      hook_info: {type: 'bitrise'},
      build_params: {
        branch: 'main',
        workflow_id: 'primary',
        environments: [
          {mapped_to: 'API_URL', value: 'https://x', is_expand: true},
        ],
      },
    });
    expect(headers).toEqual({
      'content-type': 'application/json',
      Authorization: 'tok',
    });
  });
});
