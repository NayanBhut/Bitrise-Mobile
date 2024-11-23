import React from 'react';
import {Button, useColorScheme} from 'react-native';
import AppList from './View/AppList';
import {createStackNavigator} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';
import BuildListView from './View/BuildLists';
// import BuildDetailView from './View/BuildDetailView';
import BuildDetailView from './View/BuidDetailView';
import LoginForm from './View/TokenForm';

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <MyStack />
    </NavigationContainer>
  );
}

function MyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="LoginForm"
        component={LoginForm}
        options={{
          headerTintColor: 'white',
          headerStyle: {backgroundColor: 'tomato'},
        }}
      />
      <Stack.Screen
        name="Apps List"
        component={AppList}
        options={{
          headerTintColor: 'white',
          headerStyle: {backgroundColor: 'tomato'},
        }}
      />
      <Stack.Screen
        name="BuildList"
        component={BuildListView}
        options={{
          headerTintColor: 'white',
          headerStyle: {backgroundColor: 'tomato'},
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => <Button title="Trigger Build" />,
        }}
      />
      <Stack.Screen
        name="BuildDetailView"
        component={BuildDetailView}
        options={{
          headerTintColor: 'white',
          headerStyle: {backgroundColor: 'tomato'},
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => <Button title="Get Full log" />,
        }}
      />
    </Stack.Navigator>
  );
}
const Stack = createStackNavigator();
export default App;
