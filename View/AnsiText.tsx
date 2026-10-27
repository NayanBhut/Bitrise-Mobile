import React, {useMemo} from 'react';
import {Text, TextStyle} from 'react-native';
import Anser from 'anser';
import {ColorToken} from './Theme/colors';
import {useTheme} from './Theme/useTheme';
import {ANSER_RGB_TO_KEY, getAnsiPalette, normalizeRgb} from './ansiPalette';

type AnsiTextProps = {
  ansi: string;
  containerStyle?: TextStyle;
  textStyle?: TextStyle;
  /** When true (default) the rendered log text is selectable/copyable. */
  selectable?: boolean;
};

/**
 * Resolve the themed foreground for an entry. Recognized ANSI colors map to the
 * tuned palette string for the scheme; the default/unrecognized foreground
 * follows the theme label color (a plain string on Android, an OpaqueColorValue
 * on iOS — both are valid React Native color values).
 */
function resolveEntryColor(
  fg: string | null | undefined,
  scheme: 'light' | 'dark',
  labelColor: ColorToken,
): ColorToken {
  if (fg == null || fg === '') {
    return labelColor;
  }
  const key = ANSER_RGB_TO_KEY[normalizeRgb(fg)];
  if (key == null) {
    return labelColor;
  }
  return getAnsiPalette(scheme)[key];
}

function styleForEntry(
  entry: Anser.AnserJsonEntry,
  defaultStyle: TextStyle,
  scheme: 'light' | 'dark',
  labelColor: ColorToken,
): TextStyle {
  const decorations = entry.decorations ?? [];

  return {
    ...defaultStyle,
    // Foreground always resolves through the theme-driven ANSI palette: a
    // recognized ANSI color maps to its tuned light/dark value, and the
    // default foreground (no fg) follows the theme label color.
    color: resolveEntryColor(entry.fg, scheme, labelColor),
    ...(entry.bg ? {backgroundColor: `rgb(${entry.bg})`} : {}),
    ...(decorations.includes('bold') ? {fontWeight: 'bold' as const} : {}),
    ...(decorations.includes('dim') ? {opacity: 0.5} : {}),
    ...(decorations.includes('underline')
      ? {textDecorationLine: 'underline' as const}
      : {}),
    ...(decorations.includes('italic') ? {fontStyle: 'italic' as const} : {}),
  };
}

/**
 * Small ANSI renderer for build logs. This replaces the unmaintained
 * react-native-ansi-view package while preserving its output.
 *
 * Colors are theme-aware: the 16 standard ANSI colors are remapped to a tuned
 * palette that stays WCAG-AA readable on the themed log surface in both light
 * and dark mode, and the default foreground follows the theme label color.
 * Bold/dim/underline/italic are preserved.
 */
export function AnsiText({
  ansi,
  containerStyle,
  textStyle = {},
  selectable = true,
}: AnsiTextProps) {
  const {scheme, colors} = useTheme();

  const parsedAnsi = useMemo(
    () => Anser.ansiToJson(ansi, {remove_empty: true}),
    [ansi],
  );

  return (
    <Text style={containerStyle} selectable={selectable}>
      {parsedAnsi.map((entry, index) => (
        <Text
          key={`${index}-${entry.content.length}`}
          selectable={selectable}
          style={styleForEntry(entry, textStyle, scheme, colors.label)}>
          {entry.content}
        </Text>
      ))}
    </Text>
  );
}
