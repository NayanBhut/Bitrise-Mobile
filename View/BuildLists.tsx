import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  Button,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Build, BuildModel, BuildState} from '../API Calls/BuildModel';
import BuildItem from './BuildListViews/BuildItem';
import BuildTriggerModal from './BuildTriggerModal/BuildTriggerModal';
import {auth} from './Constant';
import ApiService from '../API Calls/APIService';

const BuildListView = ({navigation, route}) => {
  const [getBuilds, setBuilds] = useState<BuildModel | null>(null);
  const [getSpinner, setSpinner] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);

  function getAppBuilds(_slug: String, next: String | null) {
    var url = `apps/${_slug}/builds?limit=20`;
    if (next === null && (getBuilds?.data ?? []).length === 0) {
    } else if (next !== null) {
      url = url + `&next=${next?.toString()}`;
    } else {
      return;
    }
    setSpinner(true);

    const apiService = new ApiService('https://api.bitrise.io/v0.1/');

    apiService
      .get(url, {
        'content-type': 'application/json',
        Authorization: auth,
      })
      .then(data => {
        setSpinner(false);

        var buildsModel: BuildModel = JSON.parse(JSON.stringify(data));
        var buildData: Build[] = getBuilds?.data ?? [];
        var newPageBuilds: Build[] = buildsModel.data;
        var totalBuilds: Build[] = buildData.concat(newPageBuilds);
        buildsModel.data = totalBuilds;

        setBuilds(buildsModel);
      })
      .catch(error => console.log('Rejection Erorr ', error));
  }

  async function abortBuild(buildSlug: string) {
    setSpinner(true);
    const myHeaders = new Headers();
    myHeaders.append('accept', 'application/json');
    myHeaders.append('Authorization', auth);
    myHeaders.append('Content-Type', 'application/json');

    // const raw = JSON.stringify({
    //   abort_reason: 'testing',
    //   abort_with_success: true,
    //   skip_notifications: true,
    // });

    // const requestOptions: RequestInit = {
    //   method: 'POST',
    //   headers: myHeaders,
    //   body: raw,
    //   redirect: 'follow',
    // };

    const objBody = {
      abort_reason: 'testing',
      abort_with_success: true,
      skip_notifications: true,
    };
    const apiService = new ApiService('https://api.bitrise.io/v0.1/apps/');
    var url = `${route.params.slug}/builds/${buildSlug}/abort`;

    apiService
      .post(url, objBody, {
        'content-type': 'application/json',
        Authorization: auth,
      })
      .then(response => {
        setSpinner(false);
        var result = JSON.parse(JSON.stringify(response));
        const message =
          result.status === 'ok' ? 'Build Aborted' : result.message;
        Alert.alert('Abort', message, [
          {
            text: 'Ok',
            onPress: () => {
              setBuilds(null);
              getAppBuilds(route.params.slug, null);
            },
          },
        ]);
      })
      .catch(error => console.error(error));
  }

  useEffect(() => {
    getAppBuilds(route.params.slug, null);
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <Button
          onPress={() => {
            setModalVisible(true);
          }}
          title="Trigger Build"
        />
      ),
    });
  }, [route.params.slug, getBuilds]);

  function getColorStyle(buildData: Build) {
    const status = buildData.item.status_text;
    let backgroundColor;

    switch (status) {
      case BuildState.Success:
      case BuildState.Abort:
        backgroundColor = '#FFF';
        break;
      default:
        backgroundColor = '#FFF';
    }

    return {backgroundColor};
  }

  function getColorStyleSideLine(buildData: Build) {
    const status = buildData.item.status_text;

    let backgroundColor;

    switch (status) {
      case BuildState.Success:
        backgroundColor = '#2a9d4c';
        break;
      case BuildState.Abort:
        backgroundColor = '#b27e00';
        break;
      case BuildState.InProgress:
        backgroundColor = '#9247c2';
        break;
      case BuildState.OnHold:
        backgroundColor = '#7d7184';
        break;
      default:
        backgroundColor = '#d72d40';
    }

    return {backgroundColor};
  }

  return (
    <SafeAreaView style={styleSheet.mainView}>
      <View style={styleSheet.mainView}>
        <Text style={styleSheet.textTriggerPipeline}>
          Total Triggered : {getBuilds?.paging.total_item_count}
        </Text>
        <FlatList
          data={getBuilds?.data ?? []}
          onEndReached={() => {
            if ((getBuilds?.data ?? []).length > 0) {
              getAppBuilds(route.params.slug, getBuilds?.paging.next ?? null);
            }
          }}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() => {
            <Text> "Footer Loader"</Text>;
          }}
          keyExtractor={(item: Build, _) => item.slug}
          renderItem={(buildData: Build) => {
            const colorStyle = getColorStyle(buildData);
            const colorStyleSideLine = getColorStyleSideLine(buildData);
            return (
              <BuildItem
                buildData={buildData}
                navigation={navigation}
                route={route}
                colorStyle={colorStyle}
                colorStyleSideLine={colorStyleSideLine}
                abortBuild={abortBuild}
              />
            );
          }}
        />
      </View>

      <BuildTriggerModal
        visible={isModalVisible}
        slug={route.params.slug}
        cancel={(isReload: boolean | null) => {
          if (isReload) {
            setBuilds(null);
            getAppBuilds(route.params.slug, null);
          }
          setModalVisible(false);
        }}
      />

      {getSpinner ? (
        <View style={styleSheet.spinnerView}>
          <ActivityIndicator size="small" color="#0000ff" />
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default BuildListView;

const styleSheet = StyleSheet.create({
  mainView: {
    flex: 1,
  },
  textTriggerPipeline: {
    padding: 5,
    color: 'black',
  },
  indicator: {
    backgroundColor: 'gray',
    margin: 10,
  },
});
