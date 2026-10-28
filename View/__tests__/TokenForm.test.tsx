/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text, TextInput} from 'react-native';
import {expect, it, describe, jest} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';

// Mock the data layer so no real network/keychain is hit.
jest.mock('../../API Calls/TokenStorage', () => ({
  getToken: jest.fn<() => Promise<string | null>>().mockResolvedValue(null),
  saveToken: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  clearToken: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

jest.mock('../../API Calls/APIService', () => ({
  __esModule: true,
  default: class {
    get = jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({data: [], paging: {next: ''}});
  },
}));

import LoginForm from '../TokenForm';

describe('LoginForm', () => {
  it('renders the Sign In button', async () => {
    const navigation = {navigate: jest.fn()};
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<LoginForm navigation={navigation} />);
    });

    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('Sign In');
  });

  it('renders a masked secure token field', async () => {
    const navigation = {navigate: jest.fn()};
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<LoginForm navigation={navigation} />);
    });

    const secureInputs = tree.root
      .findAllByType(TextInput)
      .filter(input => input.props.secureTextEntry === true);
    expect(secureInputs.length).toBeGreaterThan(0);
  });

  it('does not auto-navigate when there is no saved token', async () => {
    const navigation = {navigate: jest.fn()};
    await act(async () => {
      renderer.create(<LoginForm navigation={navigation} />);
    });

    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('shows an inline error when Sign In is pressed with an empty token', async () => {
    const navigation = {navigate: jest.fn()};
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<LoginForm navigation={navigation} />);
    });

    await act(async () => {
      tree.root.findByProps({testID: 'sign-in-button'}).props.onPress();
    });

    const labels = tree.root.findAllByType(Text).map(t => t.props.children);
    expect(labels).toContain('Enter a Bitrise personal access token.');
  });
});
