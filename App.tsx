import React from 'react';
import {Button} from 'react-native';
import AppList from './View/AppList';
import {createStackNavigator, StackNavigationProp} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';
import BuildListView from './View/BuildLists';
import BuildDetailView from './View/BuidDetailView';
import LoginForm from './View/TokenForm';

// Define types for your navigation stack
type RootStackParamList = {
  LoginForm: undefined;
  'Apps List': undefined;
  BuildList: undefined;
  BuildDetailView: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <MyStack />
    </NavigationContainer>
  );
}

function MyStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: 'white',
        headerStyle: {backgroundColor: 'tomato'},
      }}>
      <Stack.Screen
        name="LoginForm"
        component={LoginForm}
      />
      <Stack.Screen
        name="Apps List"
        component={AppList}
      />
      <Stack.Screen
        name="BuildList"
        component={BuildListView}
        options={{
          headerRight: () => <Button title="Trigger Build" onPress={() => {}} />,
        }}
      />
      <Stack.Screen
        name="BuildDetailView"
        component={BuildDetailView}
        options={{
          headerRight: () => <Button title="Get Full log" onPress={() => {}} />,
        }}
      />
    </Stack.Navigator>
  );
}

export default App;
