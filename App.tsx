import React from 'react';
import {StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppList from './View/AppList';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import BuildListView from './View/BuildLists';
import BuildDetailView from './View/BuidDetailView';
import LoginForm from './View/TokenForm';
import type {AppsModel} from './API Calls/AppsModel';

// Define types for your navigation stack
export type RootStackParamList = {
  LoginForm: undefined;
  'Apps List': {appList: AppsModel};
  BuildList: {slug: string};
  BuildDetailView: {appSlug: string; buildModel: {slug: string}};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <MyStack />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function MyStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: 'white',
        headerStyle: {backgroundColor: 'tomato'},
        headerLargeTitleStyle: {color: 'white'},
      }}>
      <Stack.Screen name="LoginForm" component={LoginForm} />
      <Stack.Screen
        name="Apps List"
        component={AppList}
        options={{headerLargeTitle: true, title: 'Apps'}}
      />
      <Stack.Screen
        name="BuildList"
        component={BuildListView}
        initialParams={{slug: ''}}
        options={{headerLargeTitle: true}}
      />
      <Stack.Screen
        name="BuildDetailView"
        component={BuildDetailView}
        initialParams={{appSlug: '', buildModel: {slug: ''}}}
      />
    </Stack.Navigator>
  );
}

export default App;

const styles = StyleSheet.create({
  root: {flex: 1},
});
