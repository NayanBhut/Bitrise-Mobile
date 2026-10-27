/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

it('renders correctly', async () => {
  // App kicks off async state updates on mount; flush them inside act so the
  // renderer does not schedule work after the Jest environment is torn down.
  await act(async () => {
    renderer.create(<App />);
  });
});
