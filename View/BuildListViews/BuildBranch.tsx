import React from 'react';
import {StyleSheet, Text, TextStyle, View, ViewStyle} from 'react-native';
import BuildItem from './BuildItem';

interface BuildBranchProps {
  buildData: BuildItem;
  colorStyle: ViewStyle | TextStyle; // If it's a style object
  colorStyleSideLine: ViewStyle | TextStyle;
}

const BuildBranch: React.FC<BuildBranchProps> = ({
  buildData,
  colorStyle,
  colorStyleSideLine,
}) => {
  return (
    <View style={[styleSheet.buildView, colorStyle]}>
      <Text style={styleSheet.branch}>{buildData.item.branch}</Text>
      <View style={styleSheet.buildStatusView}>
        <Text
          style={[
            styleSheet.buildStatus,
            colorStyleSideLine,
            styleSheet.buildStatusTextView,
          ]}>
          {buildData.item.status_text}
        </Text>
      </View>
    </View>
  );
};

export default BuildBranch;

const styleSheet = StyleSheet.create({
  buildView: {
    flexDirection: 'row',
  },
  buildStatusView: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  branch: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    textAlign: 'left',
    flexDirection: 'column',
    color: 'black',
    flex: 1,
    fontWeight: '600',
  },
  buildStatus: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    textAlign: 'left',
    flexDirection: 'column',
    color: 'black',
  },
  buildStatusTextView: {
    width: 70,
    textAlign: 'center',
  },
});
