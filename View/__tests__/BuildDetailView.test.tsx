/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text} from 'react-native';
import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {BuildState, type Build} from '../../API Calls/BuildModel';
import type {BuildDetailModel} from '../../API Calls/BuildDetailModel';

jest.mock('../../API Calls/TokenStorage', () => ({
  getToken: jest.fn().mockResolvedValue('tok'),
  saveToken: jest.fn().mockResolvedValue(undefined),
  clearToken: jest.fn().mockResolvedValue(undefined),
}));

// ApiService.get resolves/rejects per test. The `mock` prefix lets the
// jest.mock factory reference these (jest convention).
const mockGetResponse: {current: BuildDetailModel} = {
  current: {log_chunks: [], expiring_raw_log_url: ''},
};
const mockGetRejection: {current: Error | null} = {current: null};

jest.mock('../../API Calls/APIService', () => ({
  __esModule: true,
  default: class {
    get = jest.fn().mockImplementation(() => {
      if (mockGetRejection.current) {
        return Promise.reject(mockGetRejection.current);
      }
      return Promise.resolve(mockGetResponse.current);
    });
    post = jest.fn().mockResolvedValue({status: 'ok'});
  },
}));

import BuildDetailView from '../BuidDetailView';

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

function makeNavigation() {
  return {setOptions: jest.fn()};
}

const originalFetch = global.fetch;

function makeRoute(build: Build) {
  return {params: {appSlug: 'app', buildModel: build}};
}

describe('BuildDetailView', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockGetResponse.current = {log_chunks: [], expiring_raw_log_url: ''};
    mockGetRejection.current = null;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('line1\nline2'),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('renders the summary card fields and log content when chunks exist', async () => {
    mockGetResponse.current = {
      log_chunks: [{chunk: 'hello log', position: 0}],
      expiring_raw_log_url: 'https://example.com/log',
    };
    const navigation = makeNavigation();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        // @ts-expect-error minimal navigation/route stubs for render test
        <BuildDetailView navigation={navigation} route={makeRoute(makeBuild({}))} />,
      );
    });

    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('main');
    expect(labels).toContain('primary');
    expect(labels).toContain('Success');
    expect(labels).toContain('hello log');
    const hasNumber = labels.some(
      c => typeof c === 'string' && c === '#142',
    );
    expect(hasNumber).toBe(true);

    // No network was hit for the detail render (fetch is full-log only).
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows the empty state when there are no log chunks', async () => {
    mockGetResponse.current = {log_chunks: [], expiring_raw_log_url: ''};
    const navigation = makeNavigation();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        // @ts-expect-error minimal navigation/route stubs for render test
        <BuildDetailView navigation={navigation} route={makeRoute(makeBuild({}))} />,
      );
    });
    const empty = tree.root.findAllByProps({testID: 'build-detail-empty-state'});
    expect(empty.length).toBeGreaterThan(0);
  });

  it('shows a sanitized error state (with no raw error) when the detail fetch fails', async () => {
    mockGetRejection.current = new Error('raw internal failure detail');
    const navigation = makeNavigation();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        // @ts-expect-error minimal navigation/route stubs for render test
        <BuildDetailView navigation={navigation} route={makeRoute(makeBuild({}))} />,
      );
    });

    const errorState = tree.root.findAllByProps({
      testID: 'build-detail-error-state',
    });
    expect(errorState.length).toBeGreaterThan(0);

    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    // The sanitized, user-facing message is shown; the raw error never leaks.
    expect(labels).toContain('Something went wrong. Check your connection and try again.');
    const leaked = labels.some(
      c => typeof c === 'string' && c.includes('raw internal failure detail'),
    );
    expect(leaked).toBe(false);
    // A Retry affordance exists.
    expect(labels).toContain('Retry');
  });

  it('wires the header Full Log action via setOptions', async () => {
    mockGetResponse.current = {
      log_chunks: [{chunk: 'x', position: 0}],
      expiring_raw_log_url: 'https://example.com/log',
    };
    const navigation = makeNavigation();
    await act(async () => {
      renderer.create(
        // @ts-expect-error minimal navigation/route stubs for render test
        <BuildDetailView navigation={navigation} route={makeRoute(makeBuild({}))} />,
      );
    });
    expect(navigation.setOptions).toHaveBeenCalled();
  });
});
