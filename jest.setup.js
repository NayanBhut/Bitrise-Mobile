/* eslint-env jest */
/**
 * Jest setup: mock native-only modules so the component tests run on Node
 * without their native bindings.
 */

// react-native-sfsymbols (the iOS-13+ fork) renders a native component
// ("RNSfsymbols") at import time, which has no implementation on Node. Replace
// the exported SFSymbol class with a lightweight React component that forwards
// the props our tests assert on (name, color, etc.), plus the enums the
// library re-exports.
jest.mock('@mythologi/react-native-sfsymbols', () => {
  const React = require('react');
  const {View} = require('react-native');

  const SFSymbol = React.forwardRef((props, ref) =>
    React.createElement(View, {ref, ...props}),
  );
  SFSymbol.displayName = 'SFSymbol';

  return {
    SFSymbol,
    SFSymbolWeight: {
      ULTRALIGHT: 'ultralight',
      LIGHT: 'light',
      THIN: 'thin',
      REGULAR: 'regular',
      MEDIUM: 'medium',
      SEMIBOLD: 'semibold',
      BOLD: 'bold',
      HEAVY: 'heavy',
    },
    SFSymbolScale: {SMALL: 'small', MEDIUM: 'medium', LARGE: 'large'},
  };
});

// react-native-gesture-handler's ReanimatedSwipeable imports react-native-worklets
// at module load, which touches native bindings and throws on Node. Replace the
// swipeable with a lightweight component that forwards its children so rows that
// use it can be unit-tested without the native worklets runtime.
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const React = require('react');
  const {View} = require('react-native');
  const ReanimatedSwipeable = React.forwardRef((props, ref) =>
    React.createElement(View, {ref}, props.children),
  );
  ReanimatedSwipeable.displayName = 'ReanimatedSwipeable';
  return {__esModule: true, default: ReanimatedSwipeable};
});

// react-native-haptic-feedback talks to native Core Haptics / Vibration.
// Mock trigger as a spy while keeping the real HapticFeedbackTypes enum values
// so buttons can reference impactLight etc. and tests can assert the call.
jest.mock('react-native-haptic-feedback', () => {
  const HapticFeedbackTypes = {
    selection: 'selection',
    impactLight: 'impactLight',
    impactMedium: 'impactMedium',
    impactHeavy: 'impactHeavy',
    notificationSuccess: 'notificationSuccess',
    notificationWarning: 'notificationWarning',
    notificationError: 'notificationError',
  };
  const trigger = jest.fn();
  return {
    __esModule: true,
    default: {trigger},
    trigger,
    HapticFeedbackTypes,
  };
});

// react-native-reanimated (and its react-native-worklets peer) load native
// bindings at import time, which throws on Node. Replace it with a
// self-contained mock: Animated.* primitives forward props to the RN views,
// and the animation hooks/helpers resolve to synchronous no-ops so components
// that drive a shimmer can be unit-tested without the native runtime.
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const {View, Text, ScrollView} = require('react-native');

  const forward = Component => {
    const Wrapped = React.forwardRef((props, ref) =>
      React.createElement(Component, {ref, ...props}),
    );
    Wrapped.displayName = `Animated(${Component.displayName || Component.name || 'Component'})`;
    return Wrapped;
  };

  const AnimatedView = forward(View);
  const noop = () => {};
  const easingFn = () => noop;
  const createAnimatedComponent = Component => forward(Component);

  return {
    __esModule: true,
    default: {
      View: AnimatedView,
      Text: forward(Text),
      ScrollView: forward(ScrollView),
      createAnimatedComponent,
    },
    createAnimatedComponent,
    useSharedValue: initial => ({value: initial}),
    useAnimatedStyle: factory => factory(),
    withRepeat: value => value,
    withTiming: value => value,
    withSequence: (...values) => values[values.length - 1],
    withDelay: (_delay, value) => value,
    cancelAnimation: noop,
    Easing: {
      inOut: easingFn,
      ease: noop,
      linear: noop,
      bezier: easingFn,
    },
  };
});
