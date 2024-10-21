import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {AppsModel, Apps} from '../API Calls/AppsModel';
import {auth} from './Constant';
import ApiService from '../API Calls/APIService';

interface NavigationProps {
  navigate: (route: string, {}) => void;
  goBack: () => void;
  // Other navigation methods as needed
}

interface Section {
  title: string;
  data: Apps[];
}

const AppList = ({navigation}: {navigation: NavigationProps}) => {
  const [dataModel, setDataModel] = useState<AppsModel | null>(null);

  const [getSpinner, setSpinner] = useState(false);
  const [getSectionData, setSectionData] = useState<Section[]>([]);

  function getAPIData(next: String | null) {
    var url = 'me/apps?limit=20';
    if (next === null && (dataModel?.data ?? []).length === 0) {
    } else if (next !== null) {
      url = url + `&next=${next?.toString()}`;
    } else {
      return;
    }

    setSpinner(true);
    const apiService = new ApiService('https://api.bitrise.io/v0.1/');

    const response = apiService.get(url, {
      'content-type': 'application/json',
      Authorization: auth,
    });
    response
      .then(data => {
        setSpinner(false);
        const appModel: AppsModel = JSON.parse(JSON.stringify(data));
        var appsData: Apps[] = dataModel?.data ?? [];
        var newPageApps: Apps[] = appModel?.data ?? [];
        var totalApps: Apps[] = appsData.concat(newPageApps);
        appModel.data = totalApps;

        setDataModel(appModel);

        convertToSection(appModel);
      })
      .catch(error => console.log('Rejection Erorr ', error));
  }

  function convertToSection(appModel: AppsModel | null) {
    const model = appModel;

    // Initialize the array as an array of objects where the key is a string and the value is an array of Apps
    var arrSectionData: Section[] = [];

    // console.log(arrSectionData);

    const allData: Apps[] = (model?.data ?? []).sort((a, b) =>
      a.owner.name.localeCompare(b.owner.name),
    );

    // console.log(allData);
    var currentKey = '';
    var arrData: Apps[] = [];

    allData.forEach(app => {
      if (currentKey === '') {
        currentKey = app.owner.name;
        arrData.push(app);
      } else if (currentKey === app.owner.name) {
        arrData.push(app);
      } else {
        // const obj: {[key: string]: Apps[]} = {[currentKey]: arrData};
        const sectionData: Section = {title: currentKey, data: arrData};
        arrSectionData.push(sectionData);
        currentKey = app.owner.name;
        arrData = [];
        arrData.push(app);
      }
    });

    const sectionData: Section = {title: currentKey, data: arrData};
    arrSectionData.push(sectionData);

    setSectionData(arrSectionData);

    console.log('arrSectionData', arrSectionData.length);
  }

  useEffect(() => {
    console.log('Use Effect Called');
    if (auth != '') {
      getAPIData(null);
    }
  });

  // Render each item in a section
  const renderItem = ({item}: {item: Apps}) => (
    <Pressable
      onPress={() => {
        console.log(`Pressed ${item.title}`);
        navigation.navigate('BuildList', {
          slug: item.slug,
          appName: item.title,
        });
      }}>
      <View style={styleSheet.appBGView}>
        <Text style={styleSheet.appNameLabel}>{item.title}</Text>
      </View>
    </Pressable>
  );

  // Render the section header
  const renderSectionHeader = ({section}: {section: Section}) => (
    <View style={styleSheet.header}>
      <Text style={styleSheet.headerText}>{section.title}</Text>
    </View>
  );

  return auth === '' ? (
    <View style={styleSheet.noTokenView}>
      <Text style={styleSheet.noTokentext}>
        Please set auth token in Constant.tsx file
      </Text>
    </View>
  ) : (
    <SafeAreaView style={styleSheet.mainView}>
      <View style={styleSheet.mainView}>
        <SectionList
          sections={getSectionData}
          renderItem={renderItem} // Render each item
          renderSectionHeader={renderSectionHeader} // Render section header
          keyExtractor={(item, index) => index.toString()} // Unique key for each item
          onEndReachedThreshold={0.2}
          onEndReached={() => {
            getAPIData(
              dataModel?.paging.next != null ? dataModel.paging.next : null,
            );
          }}
        />
      </View>
      {getSpinner ? (
        <View style={styleSheet.spinnerView}>
          <ActivityIndicator size="small" color="#0000ff" />
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styleSheet = StyleSheet.create({
  mainView: {
    flex: 1,
    flexDirection: 'column',
  },
  appBGView: {
    flex: 1,
    backgroundColor: 'white',
    margin: 5,
    paddingVertical: 10,
    paddingHorizontal: 10,
    textAlign: 'left',
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'column',
  },
  appNameLabel: {
    color: 'black',
    fontSize: 15,
  },
  appOwnerLabel: {
    color: 'black',
    fontSize: 10,
  },
  spinnerView: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  header: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    marginTop: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  itemText: {
    fontSize: 16,
    color: 'black',
  },
  noTokenView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTokentext: {
    color: 'black',
    fontSize: 17,
  },
});

export default AppList;