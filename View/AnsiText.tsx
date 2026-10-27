import React, {useMemo} from 'react';
import {Text, TextStyle} from 'react-native';
import Anser from 'anser';

type AnsiTextProps = {
  ansi: string;
  containerStyle?: TextStyle;
  textStyle?: TextStyle;
};

function styleForEntry(
  entry: Anser.AnserJsonEntry,
  defaultStyle: TextStyle,
): TextStyle {
  const decorations = entry.decorations ?? [];

  return {
    ...defaultStyle,
    ...(entry.fg ? {color: `rgb(${entry.fg})`} : {}),
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
 */
export function AnsiText({ansi, containerStyle, textStyle = {}}: AnsiTextProps) {
  const parsedAnsi = useMemo(
    () => Anser.ansiToJson(ansi, {remove_empty: true}),
    [ansi],
  );

  return (
    <Text style={containerStyle}>
      {parsedAnsi.map((entry, index) => (
        <Text key={`${index}-${entry.content.length}`} style={styleForEntry(entry, textStyle)}>
          {entry.content}
        </Text>
      ))}
    </Text>
  );
}
