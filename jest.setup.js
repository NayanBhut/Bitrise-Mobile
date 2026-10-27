/* eslint-env jest */
/**
 * Jest setup: mock native-only modules so the component tests run on Node
 * without the New Architecture / Nitro native bindings.
 */

// react-native-nitro-sfsymbols loads a native host component at import time
// (via getHostComponent). Replace it with a lightweight React component that
// forwards the props our tests assert on, plus the const exports the library
// re-exports so AppIcon's weight/scale/rendering/animation lookups stay real.
jest.mock('react-native-nitro-sfsymbols', () => {
  const React = require('react');
  const {View} = require('react-native');

  const SFSymbolView = React.forwardRef((props, ref) =>
    React.createElement(View, {ref, ...props}),
  );
  SFSymbolView.displayName = 'SFSymbolView';

  return {
    SFSymbolView,
    SFSymbolWeight: {
      ULTRALIGHT: 'ultralight',
      THIN: 'thin',
      LIGHT: 'light',
      REGULAR: 'regular',
      MEDIUM: 'medium',
      SEMIBOLD: 'semibold',
      BOLD: 'bold',
      HEAVY: 'heavy',
      BLACK: 'black',
    },
    SFSymbolScale: {SMALL: 'small', MEDIUM: 'medium', LARGE: 'large'},
    SFSymbolRenderingMode: {
      MONOCHROME: 'monochrome',
      HIERARCHICAL: 'hierarchical',
      PALETTE: 'palette',
      MULTICOLOR: 'multicolor',
    },
    SFSymbolAnimationType: {
      BOUNCE: 'bounce',
      PULSE: 'pulse',
      SCALE: 'scale',
      ROTATE: 'rotate',
      APPEAR: 'appear',
      DISAPPEAR: 'disappear',
      REPLACE: 'replace',
      VARIABLE_COLOR: 'variableColor',
    },
    minTouchTargetStyle: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  };
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
