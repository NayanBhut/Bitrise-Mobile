import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import BuildHeader from './BuildHeader'; // Import BuildHeader component
import BuildBranch from './BuildBranch'; // Import BuildBranch component
import type {RootStackParamList} from '../../App';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';

export interface BuildItemData {
  item: {
    triggered_workflow: string;
    finished_at: string | null;
    branch: string;
    status_text: string;
    slug: string;
  };
}

// Define the interface for the props of BuildItem
interface BuildItemProps {
  buildData: BuildItemData; // Define BuildItem type for buildData
  navigation: StackNavigationProp<RootStackParamList, 'BuildList'>; // Navigation prop type
  route: RouteProp<RootStackParamList, 'BuildList'>; // Route params type
  colorStyle: any; // You can replace 'any' with ViewStyle or TextStyle for better type safety
  colorStyleSideLine: any; // Same for colorStyleSideLine
  abortBuild: (slug: string) => void; // abortBuild function type
}

// Main BuildItem component
const BuildItem: React.FC<BuildItemProps> = ({
  buildData,
  navigation,
  route,
  colorStyle,
  colorStyleSideLine,
  abortBuild,
}) => {
  return (
    <Pressable
      onPress={() => {
        navigation.navigate('BuildDetailView', {
          appSlug: route.params.slug,
          buildModel: buildData.item,
        });
      }}>
      <View style={styleSheet.cellDataView}>
        <View style={[styleSheet.cellBuildLineView, colorStyleSideLine]} />
        <View style={styleSheet.cellMainView}>
          <BuildHeader
            buildData={buildData}
            colorStyle={colorStyle}
            abortBuild={abortBuild}
          />
          <BuildBranch
            buildData={buildData}
            colorStyle={colorStyle}
            colorStyleSideLine={colorStyleSideLine}
          />
        </View>
      </View>
    </Pressable>
  );
};

export default BuildItem;

// Define styles for the component
const styleSheet = StyleSheet.create({
  cellDataView: {
    flexDirection: 'row',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 1,
    margin: 5,
  },
  cellBuildLineView: {
    backgroundColor: 'red',
    width: 5,
  },
  cellMainView: {
    flexDirection: 'column',
    flex: 1,
  },
});
