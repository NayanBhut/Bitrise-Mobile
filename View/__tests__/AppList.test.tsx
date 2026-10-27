/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text} from 'react-native';
import {expect, it, describe, jest} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';

jest.mock('../../API Calls/TokenStorage', () => ({
  getToken: jest.fn().mockResolvedValue(null),
  saveToken: jest.fn().mockResolvedValue(undefined),
  clearToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../API Calls/APIService', () => ({
  __esModule: true,
  default: class {
    get = jest.fn().mockResolvedValue({data: [], paging: {next: ''}});
  },
}));

import {afterEach, beforeEach} from '@jest/globals';
import AppList from '../AppList';
import type {Apps, AppsModel} from '../../API Calls/AppsModel';

function makeApp(partial: Partial<Apps>): Apps {
  return {
    item: undefined,
    slug: 'slug',
    title: 'App',
    project_type: 'ios',
    provider: '',
    repo_owner: '',
    repo_url: '',
    repo_slug: '',
    is_disabled: false,
    status: 0,
    is_public: false,
    is_github_checks_enabled: false,
    owner: {account_type: 'user', name: 'Owner', slug: 'owner'},
    avatar_url: null,
    ...partial,
  };
}

function makeNavigation() {
  return {navigate: jest.fn(), setOptions: jest.fn(), goBack: jest.fn()};
}

describe('AppList', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Flush VirtualizedList's deferred cell-render timers before switching
    // back to real timers so no state update lands after the test ends.
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders without throwing with an empty app list', async () => {
    const navigation = makeNavigation();
    const route = {params: {appList: {data: [], paging: {next: ''}} as AppsModel}};
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        // @ts-expect-error minimal navigation/route stubs for render test
        <AppList navigation={navigation} route={route} />,
      );
    });
    expect(tree.root).toBeTruthy();
  });

  it('shows the empty state after loading with no apps', async () => {
    const navigation = makeNavigation();
    const route = {params: {appList: {data: [], paging: {next: ''}} as AppsModel}};
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        // @ts-expect-error minimal navigation/route stubs for render test
        <AppList navigation={navigation} route={route} />,
      );
    });

    const empty = tree.root.findAllByProps({testID: 'apps-empty-state'});
    expect(empty.length).toBeGreaterThan(0);
  });

  it('renders app rows for the loaded apps', async () => {
    const navigation = makeNavigation();
    const appList: AppsModel = {
      data: [
        makeApp({slug: 'a', title: 'Alpha App'}),
        makeApp({slug: 'b', title: 'Beta App'}),
      ],
      paging: {total_item_count: 2, page_item_limit: 50, next: ''},
    };
    const route = {params: {appList}};
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        // @ts-expect-error minimal navigation/route stubs for render test
        <AppList navigation={navigation} route={route} />,
      );
    });

    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('Alpha App');
    expect(labels).toContain('Beta App');
  });

  it('sets a header Log Out button via setOptions', async () => {
    const navigation = makeNavigation();
    const route = {params: {appList: {data: [], paging: {next: ''}} as AppsModel}};
    await act(async () => {
      renderer.create(
        // @ts-expect-error minimal navigation/route stubs for render test
        <AppList navigation={navigation} route={route} />,
      );
    });

    expect(navigation.setOptions).toHaveBeenCalled();
  });
});
