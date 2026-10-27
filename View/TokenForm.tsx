import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppsModel} from '../API Calls/AppsModel';
import ApiService from '../API Calls/APIService';
import {getToken, saveToken} from '../API Calls/TokenStorage';
import {getUserFacingError} from '../API Calls/ErrorUtils';
import API_CONFIG from './APIConstants/APIConstants';

const LoginForm = ({
  navigation,
}: {
  navigation: {navigate: (r: string, p: object) => void};
}) => {
  const [token, setToken] = useState<string>('');
  const [showToken, setShowToken] = useState(false);
  const [getSpinner, setSpinner] = useState(false);

  const getAPIData = useCallback(
    (rawToken: string) => {
      const apiToken = rawToken.trim();
      if (!apiToken) {
        Alert.alert('Token required', 'Enter a Bitrise personal access token.');
        return;
      }

      const apiService = new ApiService(
        API_CONFIG.BASE_URL + API_CONFIG.API_VERSION,
      );
      const url = API_CONFIG.endpoints.apps.list(null);
      setSpinner(true);

      const response = apiService.get(url, {
        'content-type': 'application/json',
        Authorization: apiToken,
      });
      response
        .then(async data => {
          setSpinner(false);
          const appModel: AppsModel = JSON.parse(JSON.stringify(data));

          try {
            await saveToken(apiToken);
            setToken('');
            setShowToken(false);
            navigation.navigate('Apps List', {
              appList: appModel,
            });
          } catch (error) {
            if (__DEV__) {
              console.error('Unable to save the Bitrise token securely.', error);
            }
            Alert.alert(
              'Error',
              'Your token could not be stored securely. Please try again.',
            );
          }
        })
        .catch(error => {
          setSpinner(false);
          Alert.alert('Error', getUserFacingError(error));
        });
    },
    [navigation],
  );

  useEffect(() => {
    let isMounted = true;

    getToken().then(savedToken => {
      if (isMounted && savedToken != null) {
        getAPIData(savedToken);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [getAPIData]);

  return (
    <SafeAreaView style={styles.mainView}>
      <View style={styles.view}>
        <Text style={styles.tokenText}>Please add Bitrise Token</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          importantForAutofill="no"
          keyboardType="default"
          spellCheck={false}
          secureTextEntry={!showToken}
          style={styles.input}
          placeholder="Please add token"
          placeholderTextColor="black"
          textContentType="none"
          value={token}
          onChangeText={setToken}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowToken(previous => !previous)}>
          <Text style={styles.showTokenText}>
            {showToken ? 'Hide token' : 'Show token'}
          </Text>
        </Pressable>
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
  showTokenText: {
    color: '#007BFF',
    paddingBottom: 12,
  },
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
