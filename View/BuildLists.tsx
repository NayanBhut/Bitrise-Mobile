import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Build, BuildModel} from '../API Calls/BuildModel';
import BuildItem from './BuildListViews/BuildItem';
import BuildTriggerModal from './BuildTriggerModal/BuildTriggerModal';

import ApiService from '../API Calls/APIService';
import {getToken} from '../API Calls/TokenStorage';
import {getUserFacingError} from '../API Calls/ErrorUtils';
import API_CONFIG from './APIConstants/APIConstants';
import type {RootStackParamList} from '../App';
import {RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from './Theme/useTheme';
import {AppIcon} from './Components/AppIcon';
import {EmptyState} from './Components/EmptyState';
import {ErrorState} from './Components/ErrorState';
import {SkeletonRow} from './Components/SkeletonRow';

type BuildListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BuildList'>;
  route: RouteProp<RootStackParamList, 'BuildList'>;
};

/** Number of skeleton placeholder rows shown during the initial load. */
const SKELETON_COUNT = 6;

/**
 * Header-right Trigger button. Module-scope so it is a stable component type
 * (no unstable-nested-component warning). Icon-only with a 44pt target.
 */
function TriggerButton({
  onPress,
  color,
  hitSlop,
}: {
  onPress: () => void;
  color?: string;
  hitSlop: {top: number; bottom: number; left: number; right: number};
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Trigger build"
      accessibilityHint="Opens the build trigger form"
      hitSlop={hitSlop}
      onPress={onPress}
      style={styleSheet.headerButton}>
      <AppIcon name="trigger" size={22} color={color} accessibilityLabel="Trigger build" />
    </Pressable>
  );
}

const BuildListView = ({navigation, route}: BuildListScreenProps) => {
  const theme = useTheme();
  const {colors} = theme;

  const [getBuilds, setBuilds] = useState<BuildModel | null>(null);
  const [getSpinner, setSpinner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isAbortVisible, setAbortVisible] = useState(true);
  const [abortBuildSlug, setAbortBuildSlug] = useState('');

  async function getAppBuilds(_slug: string, next: string | null) {
    const auth: string | null = await getToken();
    if (auth === null) {
      return;
    }

    // Only fetch if:
    // - It's the first load (next === null && no data)
    // - Or it's pagination (next !== null)
    if (next === null && (getBuilds?.data ?? []).length > 0) {
      return; // Skip if data already exists and not paginating
    }

    setError(null);
    setSpinner(true);

    const apiService = new ApiService(API_CONFIG.BASE_URL + API_CONFIG.API_VERSION);
    const url = API_CONFIG.endpoints.builds.list(_slug, next);

    apiService
      .get(url, {
        'content-type': 'application/json',
        Authorization: auth,
      })
      .then(data => {
        setSpinner(false);
        setHasLoaded(true);

        const buildsModel: BuildModel = JSON.parse(JSON.stringify(data));
        const buildData: Build[] = getBuilds?.data ?? [];
        const newPageBuilds: Build[] = buildsModel.data ?? [];
        const totalBuilds: Build[] = [...buildData, ...newPageBuilds];
        buildsModel.data = totalBuilds;

        setBuilds(buildsModel);
        applyTitle(buildsModel);
      })
      .catch(fetchError => {
        setSpinner(false);
        setHasLoaded(true);
        setError(getUserFacingError(fetchError));
      });
  }

  /**
   * Pull-to-refresh / retry: fetches the first page and REPLACES the loaded
   * data instead of concatenating. Bypasses the "already loaded" guard in
   * {@link getAppBuilds} while leaving the next-token pagination contract
   * untouched.
   */
  async function refresh() {
    const auth: string | null = await getToken();
    if (auth === null) {
      return;
    }

    setRefreshing(true);
    setError(null);

    const apiService = new ApiService(API_CONFIG.BASE_URL + API_CONFIG.API_VERSION);
    const url = API_CONFIG.endpoints.builds.list(route.params.slug, null);

    apiService
      .get(url, {
        'content-type': 'application/json',
        Authorization: auth,
      })
      .then(data => {
        setRefreshing(false);
        setHasLoaded(true);
        const buildsModel: BuildModel = JSON.parse(JSON.stringify(data));
        setBuilds(buildsModel);
        applyTitle(buildsModel);
      })
      .catch(fetchError => {
        setRefreshing(false);
        setHasLoaded(true);
        setError(getUserFacingError(fetchError));
      });
  }

  /** Set the native large title to the app name once the first build is known. */
  function applyTitle(model: BuildModel | null) {
    const title = model?.data?.[0]?.repository?.title;
    if (typeof title === 'string' && title.length > 0) {
      navigation.setOptions({title});
    }
  }

  async function abortBuild(buildSlug: string, reason: string) {
    const auth: string | null = await getToken();
    if (auth === null) {
      return;
    }

    setSpinner(true);

    const objBody = {
      abort_reason: reason,
      abort_with_success: true,
      skip_notifications: true,
    };

    const apiService = new ApiService(API_CONFIG.BASE_URL + API_CONFIG.API_VERSION);
    const url = API_CONFIG.endpoints.builds.abort(route.params.slug, buildSlug);
    apiService
      .post(url, objBody, {
        'content-type': 'application/json',
        Authorization: auth,
      })
      .then(response => {
        setSpinner(false);
        var result = JSON.parse(JSON.stringify(response));
        const message =
          result.status === 'ok'
            ? 'Build Aborted'
            : 'The build could not be aborted. Please try again.';
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
      .catch(abortError => {
        setSpinner(false);
        if (__DEV__) {
          console.error('Unable to abort the build.', abortError);
        }
        Alert.alert('Error', getUserFacingError(abortError));
      });
  }

  useEffect(() => {
    getAppBuilds(route.params.slug, null);
    const accent = colors.accent;
    const tint = typeof accent === 'string' ? accent : undefined;
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <TriggerButton
          onPress={() => setModalVisible(true)}
          color={tint}
          hitSlop={theme.spacing.hitSlop}
        />
      ),
    });
    // Fetching is intentionally tied to the app slug. getAppBuilds closes over
    // the latest pagination state, so adding it as a dependency would refetch
    // forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params.slug, colors.accent]);

  /** Both swipe-to-abort and long-press funnel here to confirm the reason. */
  function openAbortSheet(slug: string) {
    setAbortBuildSlug(slug);
    setAbortVisible(true);
  }

  const builds = getBuilds?.data ?? [];
  const isInitialLoading = getSpinner && builds.length === 0 && !refreshing;
  const hasFetchError = error != null && builds.length === 0;
  const isEmpty = hasLoaded && !hasFetchError && !isInitialLoading && builds.length === 0;

  const mainBackground: ViewStyle = {backgroundColor: colors.groupedBackground};
  const accentColor = colors.accent;

  function renderBody() {
    if (isInitialLoading) {
      return (
        <View>
          {Array.from({length: SKELETON_COUNT}).map((_, index) => (
            <SkeletonRow key={index} />
          ))}
        </View>
      );
    }

    if (hasFetchError) {
      return (
        <ErrorState
          message={error as string}
          onRetry={() => {
            setError(null);
            refresh();
          }}
          testID="builds-error-state"
        />
      );
    }

    if (isEmpty) {
      return (
        <View style={styleSheet.flex}>
          <EmptyState
            icon="build"
            title="No builds yet"
            message="Builds you trigger for this app will show up here."
            testID="builds-empty-state"
          />
        </View>
      );
    }

    return (
      <FlatList
        data={builds}
        keyExtractor={(item: Build) => item.slug}
        renderItem={({item}: {item: Build}) => (
          <BuildItem
            buildData={{item}}
            navigation={navigation}
            route={route}
            onAbort={openAbortSheet}
          />
        )}
        onEndReached={() => {
          if ((getBuilds?.data ?? []).length > 0) {
            getAppBuilds(route.params.slug, getBuilds?.paging.next ?? null);
          }
        }}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        ListFooterComponent={
          getSpinner && builds.length > 0 ? (
            <View style={styleSheet.footerSpinner}>
              <ActivityIndicator
                size="small"
                color={typeof accentColor === 'string' ? accentColor : undefined}
              />
            </View>
          ) : undefined
        }
      />
    );
  }

  return (
    <SafeAreaView style={[styleSheet.flex, mainBackground]} edges={['bottom']}>
      {renderBody()}

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
        // eslint-disable-next-line eqeqeq
        isAbortVisible={isAbortVisible && abortBuildSlug.length != 0}
        abortBuild={(isAbort, reason) => {
          setAbortVisible(false);
          setModalVisible(false);
          if (isAbort) {
            abortBuild(abortBuildSlug, reason);
            setAbortBuildSlug('');
          } else {
            setAbortBuildSlug('');
          }
        }}
      />
    </SafeAreaView>
  );
};

export default BuildListView;

const styleSheet = StyleSheet.create({
  flex: {
    flex: 1,
  },
  footerSpinner: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
