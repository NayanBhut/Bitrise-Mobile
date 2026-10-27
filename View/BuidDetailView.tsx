import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Button, View} from 'react-native';
import {StyleSheet} from 'react-native';
import {BuildDetailModel} from '../API Calls/BuildDetailModel';
import {AnsiText} from './AnsiText';

import {ScrollView} from 'react-native-gesture-handler';
import {LogChunks} from '../API Calls/BuildDetailModel';
import ApiService from '../API Calls/APIService';
import {getToken} from '../API Calls/TokenStorage';
import {getUserFacingError} from '../API Calls/ErrorUtils';
import API_CONFIG from './APIConstants/APIConstants';

const BuildDetailView = ({navigation, route}: {navigation: {setOptions: (opts: object) => void}; route: {params: {appSlug: string; buildModel: {slug: string}}}}) => {
  const [getBuildData, setBuildData] = useState<BuildDetailModel | null>(null);

  const [loader, setLoader] = useState<Boolean>(false);
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  function getLogs(_url: string) {
    setLoader(true);
    const requestOptions: RequestInit = {
      method: 'GET',
    };

    fetch(_url, requestOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error('The full log request failed.');
        }
        return response.text();
      })
      .then(result => {
        const arrChunks: LogChunks[] = result.split('\n').map(text => {
          const chunk: LogChunks = {chunk: text, position: 0};
          return chunk;
        });

        setBuildData(prevState => ({
          ...prevState,
          log_chunks: arrChunks,
          expiring_raw_log_url: getBuildData?.expiring_raw_log_url ?? '',
        }));
        setLoader(false);
      })
      .catch(error => {
        setLoader(false);
        Alert.alert('Error', getUserFacingError(error));
      });
  }

  async function getBuildDetails(_appSlug: string, _buildSlug: string) {
    const auth: string | null = await getToken();
    if (auth === null) {
      return;
    }

    setLoader(true);

    const apiService = new ApiService(API_CONFIG.BASE_URL + API_CONFIG.API_VERSION);
    const url = API_CONFIG.endpoints.builds.logs(_appSlug, _buildSlug);

    apiService
      .get(url, {
        'content-type': 'application/json',
        Authorization: auth,
      })
      .then(data => {
        const buildsModel: BuildDetailModel = JSON.parse(JSON.stringify(data));

        const model: BuildDetailModel = buildsModel;
        model.log_chunks = buildsModel.log_chunks;

        setBuildData(model);
        setLoader(false);
      })
      .catch(error => {
        setLoader(false);
        Alert.alert('Error', getUserFacingError(error));
      });
  }

  useEffect(() => {
    getBuildDetails(route.params.appSlug, route.params.buildModel.slug);
  }, [route.params.appSlug, route.params.buildModel.slug]);

  // Log when getBuildData is updated
  useEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <Button
          onPress={() => {
            if (getBuildData?.expiring_raw_log_url != null) {
              getLogs(getBuildData?.expiring_raw_log_url.toString()); // Use getFullLogURL directly
            } else {
              Alert.alert('Full Log', 'The full log is not available yet.');
            }
          }}
          title="Full Log"
        />
      ),
    });
  // The header action needs the latest build/log URL. Re-running this effect
  // whenever getBuildData changes is intentional.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getBuildData]); // This effect will run whenever getBuildData changes

  return (
    <View style={styles.superView}>
      {loader ? (
        <View style={styles.viewIndicator}>
          <ActivityIndicator size="small" color="#0000ff" />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          onContentSizeChange={() => {
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollToEnd({animated: false});
            }
          }}>
          <View style={styles.container}>
            {(getBuildData?.log_chunks ?? []).map((line, index) => (
              <View style={styles.ansiSuperView}>
                <AnsiText
                  textStyle={styles.defaultText}
                  containerStyle={styles.line}
                  ansi={(getBuildData?.log_chunks[index].chunk ?? '').toString()}
                  key={`k-${index}`}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  superView: {flex: 1, justifyContent: 'center'},
  container: {
    flex: 1,
  },
  line: {
    backgroundColor: 'black',
  },
  viewIndicator: {
    flex: 1,
    justifyContent: 'center',
  },
  ansiSuperView: {
    marginHorizontal: 0,
  },
  defaultText: {
    color: 'white',
  },
});

export default BuildDetailView;
