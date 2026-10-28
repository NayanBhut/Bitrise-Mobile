/**
 * @format
 */

import 'react-native';
import React from 'react';
import {TextInput} from 'react-native';
import {expect, it, describe} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {SecureField} from '../SecureField';

describe('SecureField', () => {
  it('enforces the secure input defaults on the TextInput', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<SecureField value="" onChangeText={() => {}} />);
    });

    const input = tree.root.findByType(TextInput);
    expect(input.props.secureTextEntry).toBe(true);
    expect(input.props.autoComplete).toBe('off');
    expect(input.props.autoCorrect).toBe(false);
    expect(input.props.spellCheck).toBe(false);
    expect(input.props.importantForAutofill).toBe('no');
    expect(input.props.textContentType).toBe('none');
  });

  it('keeps secure defaults even if a caller tries to override them', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      // Pass unknown props to prove overrides are ignored (types forbid them).
      tree = renderer.create(
        React.createElement(SecureField, {
          value: '',
          onChangeText: () => {},
          autoComplete: 'password',
          autoCorrect: true,
          secureTextEntry: false,
        } as any),
      );
    });

    const input = tree.root.findByType(TextInput);
    expect(input.props.secureTextEntry).toBe(true);
    expect(input.props.autoComplete).toBe('off');
    expect(input.props.autoCorrect).toBe(false);
  });

  it('toggles secureTextEntry when the eye button is pressed', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<SecureField value="" onChangeText={() => {}} />);
    });

    expect(tree.root.findByType(TextInput).props.secureTextEntry).toBe(true);

    await act(async () => {
      tree.root
        .findAllByProps({testID: 'secure-field-toggle'})[0]
        .props.onPress();
    });

    expect(tree.root.findByType(TextInput).props.secureTextEntry).toBe(false);
  });
});
