import {useEffect, useState} from 'react';
import {AccessibilityInfo, useColorScheme} from 'react-native';
import {ColorSchemeName, getColors, ThemeColors} from './colors';
import * as spacing from './spacing';
import * as type from './typography';

/** Value returned by {@link useTheme}. */
export interface Theme {
  /** Resolved semantic color tokens for the active scheme. */
  colors: ThemeColors;
  /** Typography module (Apple text styles + mono token). */
  type: typeof type;
  /** Layout module (8pt grid, radii, hit slop, touch target). */
  spacing: typeof spacing;
  /** Active color scheme ('light' | 'dark'). */
  scheme: ColorSchemeName;
  /** Whether the user has Reduce Motion enabled. */
  reduceMotion: boolean;
  /** Whether the user has Bold Text enabled. */
  boldText: boolean;
}

/**
 * Theme hook returning colors, typography, spacing, the active color scheme,
 * and live accessibility flags (Reduce Motion, Bold Text).
 *
 * It subscribes to `useColorScheme()` and `AccessibilityInfo` so the UI
 * updates live when the user changes appearance or accessibility settings.
 */
export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const scheme: ColorSchemeName = systemScheme === 'dark' ? 'dark' : 'light';

  const [reduceMotion, setReduceMotion] = useState(false);
  const [boldText, setBoldText] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });
    AccessibilityInfo.isBoldTextEnabled().then(enabled => {
      if (mounted) {
        setBoldText(enabled);
      }
    });

    const reduceMotionSub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    const boldTextSub = AccessibilityInfo.addEventListener(
      'boldTextChanged',
      setBoldText,
    );

    return () => {
      mounted = false;
      reduceMotionSub.remove();
      boldTextSub.remove();
    };
  }, []);

  return {
    colors: getColors(scheme),
    type,
    spacing,
    scheme,
    reduceMotion,
    boldText,
  };
}
