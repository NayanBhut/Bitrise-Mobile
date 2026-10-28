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
import {useTheme} from './View/Theme/useTheme';
import type {ColorToken} from './View/Theme/colors';

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

// Header color props accept plain color strings. On iOS our theme tokens are
// `PlatformColor` objects (not strings), so we narrow to a string or leave the
// prop undefined — undefined lets the native-stack header fall back to iOS's
// own system-semantic chrome (adaptive background, label title, systemBlue
// tint), which is already HIG-correct. On Android the tokens are literals and
// drive the header so it follows the active light/dark palette.
function asStringColor(color: ColorToken): string | undefined {
  return typeof color === 'string' ? color : undefined;
}

function MyStack() {
  const {colors} = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        // Drive header chrome from the theme so it follows system appearance
        // (light/dark) instead of the previous fixed non-semantic literals.
        headerTintColor: asStringColor(colors.accent),
        headerStyle: {backgroundColor: asStringColor(colors.background)},
        headerLargeTitleStyle: {color: asStringColor(colors.label)},
        headerTitleStyle: {color: asStringColor(colors.label)},
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
