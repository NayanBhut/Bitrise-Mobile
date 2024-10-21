import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Button, Text, View} from 'react-native';
import {StyleSheet} from 'react-native';
import {BuildDetailModel} from '../API Calls/BuildDetailModel';
import {AnsiComponent} from 'react-native-ansi-view';

import {ScrollView} from 'react-native-gesture-handler';
import {LogChunks} from '../API Calls/BuildDetailModel';
import ApiService from '../API Calls/APIService';
import {auth} from './Constant';

const BuildDetailView = ({navigation, route}) => {
  const [getBuildData, setBuildData] = useState<BuildDetailModel | null>(null);

  const [loader, setLoader] = useState<Boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  function getLogs(_url: string) {
    setLoader(true);
    const requestOptions: RequestInit = {
      method: 'GET',
      redirect: 'follow',
    };

    fetch(_url, requestOptions)
      .then(response => {
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
        console.error(error);
      });
  }

  function getBuildDetails(_appSlug: String, _buildSlug: String) {
    setLoader(true);

    const apiService = new ApiService('https://api.bitrise.io/v0.1/');
    const url = `apps/${_appSlug}/builds/${_buildSlug}/log`;

    apiService
      .get(url, {
        'content-type': 'application/json',
        Authorization: auth,
      })
      .then(data => {
        // console.log('Builds are ', data);
        const buildsModel: BuildDetailModel = JSON.parse(JSON.stringify(data));

        const model: BuildDetailModel = buildsModel;
        model.log_chunks = buildsModel.log_chunks;

        console.log(model);
        setBuildData(model);
        console.log(getBuildData?.log_chunks ?? []);

        setLoader(false);
      })
      .catch(error => console.log('Rejection Erorr ', error));
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
              console.log('Full log URL is not available yet.');
            }
          }}
          title="Full Log"
        />
      ),
    });
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
                <AnsiComponent
                  textStyle={styles.defaultText}
                  containerStyle={styles.line}
                  ansi={(
                    getBuildData?.log_chunks[index].chunk ?? ''
                  ).toString()}
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
