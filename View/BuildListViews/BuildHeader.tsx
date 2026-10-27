import React from 'react';
import {StyleSheet, Text, TextStyle, View} from 'react-native';
import {Build} from '../../API Calls/BuildModel';
import {StatusBadge} from '../Components/StatusBadge';
import {Theme} from '../Theme/useTheme';

interface BuildHeaderProps {
  build: Build;
  theme: Theme;
}

/**
 * Top line of a build card: the {@link StatusBadge} on the left and the build
 * number rendered mono on the right. Theme-only; no color literals.
 */
const BuildHeader: React.FC<BuildHeaderProps> = ({build, theme}) => {
  const {colors, type} = theme;
  const numberStyle: TextStyle = {
    fontFamily: type.mono,
    fontSize: type.subheadline.fontSize,
    color: colors.secondaryLabel,
  };

  return (
    <View style={styleSheet.row}>
      <StatusBadge state={build.status_text} />
      <Text style={numberStyle} allowFontScaling>
        #{build.build_number}
      </Text>
    </View>
  );
};

export default BuildHeader;

const styleSheet = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
