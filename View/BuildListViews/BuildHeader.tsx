import React from 'react';
import {Text, Pressable, View, StyleSheet} from 'react-native';
import BuildItem from './BuildItem';

interface BuildHeaderProps {
  buildData: BuildItem;
  colorStyle: any; // Replace 'any' with the actual type for style, like ViewStyle or TextStyle
  abortBuild: (slug: string) => void; // Assuming abortBuild is a function that accepts a slug and returns void
}

const BuildHeader: React.FC<BuildHeaderProps> = ({
  buildData,
  colorStyle,
  abortBuild,
}) => {
  function getParsedDate(strDate: string): string {
    var strSplitDate = String(strDate).split(' ');
    var date = new Date(strSplitDate[0]);
    var day = date.getDate().toString();
    var hh = date.getHours();
    var minutes = date.getMinutes();

    const month = date.toLocaleString('default', {month: 'short'});

    var yyyy = date.getFullYear().toString().substring(2);
    if (date.getDate() < 10) {
      day = '0' + day;
    }

    const dateString =
      day + '-' + month + '-' + yyyy + ' ' + hh + ':' + minutes + ' ';
    return dateString;
  }

  return (
    <View style={[styleSheet.buildView, colorStyle]}>
      <Text style={styleSheet.branch}>{buildData.item.triggered_workflow}</Text>
      {buildData.item.finished_at === null ? (
        <Pressable
          onPress={() => {
            abortBuild(buildData.item.slug);
          }}>
          <Text style={styleSheet.abortButton}>Abort</Text>
        </Pressable>
      ) : (
        <Text style={styleSheet.buildStatus}>
          {getParsedDate(buildData.item.finished_at)}
        </Text>
      )}
    </View>
  );
};

export default BuildHeader;

const styleSheet = StyleSheet.create({
  buildView: {
    flexDirection: 'row',
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
  abortButton: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    textAlign: 'center',
    flexDirection: 'column',
    color: 'black',
    backgroundColor: 'red',
    width: 70,
  },
  buildStatus: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    textAlign: 'left',
    flexDirection: 'column',
    color: 'black',
  },
});
