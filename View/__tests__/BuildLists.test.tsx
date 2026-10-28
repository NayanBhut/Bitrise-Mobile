/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text} from 'react-native';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {BuildState, type Build, type BuildModel} from '../../API Calls/BuildModel';

jest.mock('../../API Calls/TokenStorage', () => ({
  getToken: jest.fn<() => Promise<string | null>>().mockResolvedValue('tok'),
  saveToken: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  clearToken: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

// The render test must not hit the network. ApiService.get resolves to a
// BuildModel-shaped object controlled per test; post resolves to an ok status.
// The `mock` prefix lets the jest.mock factory reference it (jest convention).
const mockGetResponse: {current: BuildModel} = {
  current: {data: [], paging: {next: ''} as any},
};

jest.mock('../../API Calls/APIService', () => ({
  __esModule: true,
  default: class {
    get = jest
      .fn<() => Promise<unknown>>()
      .mockImplementation(() => Promise.resolve(mockGetResponse.current));
    post = jest.fn<() => Promise<unknown>>().mockResolvedValue({status: 'ok'});
  },
}));

// ReanimatedSwipeable is globally mocked in jest.setup.js (it imports
// react-native-worklets at module load, which throws on Node).

import BuildListView from '../BuildLists';

function makeBuild(partial: Partial<Build>): Build {
  return {
    item: undefined,
    triggered_at: '2024-01-10T12:00:00Z',
    started_on_worker_at: '2024-01-10T12:00:01Z',
    environment_prepare_finished_at: '',
    finished_at: '2024-01-10T12:01:00Z',
    slug: 'build-slug',
    status: 1,
    status_text: BuildState.Success,
    is_on_hold: false,
    is_processed: true,
    branch: 'main',
    build_number: 142,
    tag: null,
    triggered_workflow: 'primary',
    triggered_by: '',
    machine_type_id: '',
    stack_identifier: '',
    original_build_params: {} as any,
    pull_request_id: 0,
    pull_request_target_branch: null,
    pull_request_view_url: null,
    repository: {title: 'My App'} as any,
    credit_cost: 0,
    ...partial,
  };
}

function makeModel(data: Build[]): BuildModel {
  return {data, paging: {total_item_count: data.length, page_item_limit: 50, next: ''}};
}

function makeNavigation() {
  return {navigate: jest.fn(), setOptions: jest.fn(), goBack: jest.fn()};
}

const route = {params: {slug: 'app-slug'}};

describe('BuildListView', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockGetResponse.current = makeModel([]);
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('mounts with an empty list and shows the empty state', async () => {
    const navigation = makeNavigation();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        // @ts-expect-error minimal navigation/route stubs for render test
        <BuildListView navigation={navigation} route={route} />,
      );
    });
    const empty = tree.root.findAllByProps({testID: 'builds-empty-state'});
    expect(empty.length).toBeGreaterThan(0);
  });

  it('renders a success build number, branch, workflow, and status label', async () => {
    mockGetResponse.current = makeModel([makeBuild({})]);
    const navigation = makeNavigation();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        // @ts-expect-error minimal navigation/route stubs for render test
        <BuildListView navigation={navigation} route={route} />,
      );
    });

    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('main');
    expect(labels).toContain('primary');
    expect(labels).toContain('Success');
    // Build number is rendered as ['#', 142].
    const hasNumber = labels.some(
      c => Array.isArray(c) && c.includes('#') && c.includes(142),
    );
    expect(hasNumber).toBe(true);
  });

  it('wires a header button via setOptions', async () => {
    const navigation = makeNavigation();
    await act(async () => {
      renderer.create(
        // @ts-expect-error minimal navigation/route stubs for render test
        <BuildListView navigation={navigation} route={route} />,
      );
    });
    expect(navigation.setOptions).toHaveBeenCalled();
  });

  it('renders an in-progress build (abort wiring present) without throwing', async () => {
    mockGetResponse.current = makeModel([
      makeBuild({
        slug: 'running',
        // Running builds report a null finished_at from the API even though the
        // model types it as string; that null is what drives the abort path.
        finished_at: null as unknown as string,
        status_text: BuildState.InProgress,
      }),
    ]);
    const navigation = makeNavigation();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        // @ts-expect-error minimal navigation/route stubs for render test
        <BuildListView navigation={navigation} route={route} />,
      );
    });
    expect(tree.root).toBeTruthy();
    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('In Progress');
  });
});
