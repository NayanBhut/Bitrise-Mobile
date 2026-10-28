import React from 'react';
import {StyleSheet, Text, TextStyle, View} from 'react-native';
import {Build} from '../../API Calls/BuildModel';
import {AppIcon} from '../Components/AppIcon';
import {Theme} from '../Theme/useTheme';

interface BuildBranchProps {
  build: Build;
  theme: Theme;
}

/**
 * Branch line of a build card: the `branch` symbol followed by the branch name
 * rendered mono. Theme-only; no color literals.
 */
const BuildBranch: React.FC<BuildBranchProps> = ({build, theme}) => {
  const {colors, type, spacing} = theme;
  const branchStyle: TextStyle = {
    fontFamily: type.mono,
    fontSize: type.subheadline.fontSize,
    color: colors.label,
    marginLeft: spacing.spacing.xs,
    flexShrink: 1,
  };

  return (
    <View style={styleSheet.row}>
      <AppIcon name="branch" size={14} color={colors.label} />
      <Text style={branchStyle} numberOfLines={1} allowFontScaling>
        {build.branch}
      </Text>
    </View>
  );
};

export default BuildBranch;

const styleSheet = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
