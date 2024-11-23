import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {AppsModel} from '../API Calls/AppsModel';
import ApiService from '../API Calls/APIService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from './APIConstants/APIConstants';

const LoginForm = ({navigation, route}) => {
  const [token, setToken] = useState<string>('');
  const [getSpinner, setSpinner] = useState(false);


  function getAPIData(apiToken: string) {
    const apiService = new ApiService(API_CONFIG.BASE_URL);
    const url = API_CONFIG.endpoints.apps.list(null);
    setSpinner(true);

    const response = apiService.get(url, {
      'content-type': 'application/json',
      Authorization: apiToken,
    });
    response
      .then(data => {
        setSpinner(false);
        const appModel: AppsModel = JSON.parse(JSON.stringify(data));

        try {
          AsyncStorage.setItem('token', apiToken).then(() => {
            navigation.navigate('Apps List', {
              appList: appModel,
            });
          });
        } catch (e) {
          // saving error
        }
      })
      .catch(error => {
        setSpinner(false);
        Alert.alert('Error', error);
      });
  }

  useEffect(() => {
    AsyncStorage.getItem('token').then(savedToken => {
      if (savedToken != null) {
        getAPIData(savedToken);
      }
    });
  }, []);

  return (
    <SafeAreaView style={styles.mainView}>
      <View style={styles.view}>
        <Text style={styles.tokenText}>Please add Bitrise Token</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          spellCheck={false}
          style={styles.input}
          placeholder="Please add token"
          placeholderTextColor="black"
          value={token}
          onChangeText={setToken}
        />
        <Pressable
          onPress={() => {
            getAPIData(token);
          }}>
          <View style={styles.buttonView}>
            <Text style={styles.buttonTitle}>Navigate to App List</Text>
          </View>
        </Pressable>
      </View>
      {getSpinner ? (
        <View style={styles.spinnerView}>
          <ActivityIndicator size="small" color="#0000ff" />
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default LoginForm;

const styles = StyleSheet.create({
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingLeft: 10,
    color: 'black',
  },
  mainView: {flex: 1, flexDirection: 'column'},
  view: {padding: 10},
  tokenText: {fontSize: 20, paddingBottom: 20, color: 'black'},
  buttonView: {
    backgroundColor: 'black',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTitle: {color: 'white'},
  spinnerView: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
});
