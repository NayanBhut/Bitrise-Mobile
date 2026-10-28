import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageStyle,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppsModel, Apps} from '../API Calls/AppsModel';
import ApiService from '../API Calls/APIService';
import {clearToken, getToken} from '../API Calls/TokenStorage';
import {getUserFacingError} from '../API Calls/ErrorUtils';
import API_CONFIG from './APIConstants/APIConstants';
import type {RootStackParamList} from '../App';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {useTheme, Theme} from './Theme/useTheme';
import {AppIcon} from './Components/AppIcon';
import {EmptyState} from './Components/EmptyState';
import {ErrorState} from './Components/ErrorState';
import {SkeletonRow} from './Components/SkeletonRow';

interface Section {
  title: string;
  data: Apps[];
}

type AppListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Apps List'>;
  route: RouteProp<RootStackParamList, 'Apps List'>;
};

/** Number of skeleton placeholder rows shown during the initial load. */
const SKELETON_COUNT = 6;

/**
 * Client-side filter over the already-grouped sections. Matches the app title
 * or owner name (case-insensitive). Never touches pagination or the API.
 */
function filterSections(sections: Section[], query: string): Section[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return sections;
  }
  return sections
    .map(section => {
      const data = section.data.filter(
        app =>
          app.title.toLowerCase().includes(needle) ||
          app.owner.name.toLowerCase().includes(needle),
      );
      return {title: section.title, data};
    })
    .filter(section => section.data.length > 0);
}

/**
 * A single app row: an avatar image when available (otherwise the `apps`
 * symbol fallback), the app title, its project type as subtitle, and a
 * disclosure chevron. Reads as one combined accessibility element and takes
 * the button role. Defined at module scope to avoid an unstable nested
 * component.
 */
function AppListRow({
  app,
  theme,
  onPress,
}: {
  app: Apps;
  theme: Theme;
  onPress: () => void;
}) {
  const {colors, type, spacing} = theme;
  const subtitle = app.project_type;
  const combinedLabel = subtitle ? `${app.title}, ${subtitle}` : app.title;
  const hasAvatar = typeof app.avatar_url === 'string' && app.avatar_url.length > 0;

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: spacing.minTouchTarget,
    paddingVertical: spacing.spacing.sm,
    paddingHorizontal: spacing.spacing.md,
    backgroundColor: colors.secondaryGroupedBackground,
  };

  const leadingStyle: ViewStyle = {marginRight: spacing.spacing.md};
  const avatarStyle: ImageStyle = {
    width: 28,
    height: 28,
    borderRadius: spacing.radius.sm,
  };
  const titleStyle: TextStyle = {...type.body, color: colors.label};
  const subtitleStyle: TextStyle = {
    ...type.footnote,
    color: colors.secondaryLabel,
    marginTop: spacing.spacing.xs,
  };
  const accessoryStyle: ViewStyle = {marginLeft: spacing.spacing.sm};

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={combinedLabel}
      accessibilityHint="Opens this app's builds"
      onPress={onPress}
      style={rowStyle}>
      <View style={leadingStyle}>
        {hasAvatar ? (
          <Image source={{uri: app.avatar_url}} style={avatarStyle} />
        ) : (
          <AppIcon name="apps" size={22} />
        )}
      </View>
      <View style={styleSheet.rowCenter}>
        <Text style={titleStyle} allowFontScaling>
          {app.title}
        </Text>
        {subtitle ? (
          <Text style={subtitleStyle} allowFontScaling>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={accessoryStyle}>
        <AppIcon name="chevron" size={16} color={colors.tertiaryLabel} />
      </View>
    </Pressable>
  );
}

/** Hairline row separator, inset to align with row text. Reads its own theme. */
function RowSeparator() {
  const {colors, spacing} = useTheme();
  const separatorStyle: ViewStyle = {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: spacing.spacing.md,
  };
  return <View style={separatorStyle} />;
}

const AppList = ({navigation, route}: AppListScreenProps) => {
  const theme = useTheme();
  const {colors, type, spacing} = theme;

  const [dataModel, setDataModel] = useState<AppsModel | null>(null);
  const [getSpinner, setSpinner] = useState(false);
  const [getSectionData, setSectionData] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  async function getAPIData(next: string | null) {
    const auth: string | null = await getToken();
    if (auth === null) {
      return;
    }

    if (next === null && (dataModel?.data ?? []).length === 0) {
    } else if (next !== null) {
    } else {
      return;
    }

    setError(null);
    setSpinner(true);
    const apiService = new ApiService(API_CONFIG.BASE_URL + API_CONFIG.API_VERSION);
    const url = API_CONFIG.endpoints.apps.list(next);
    const response = apiService.get(url, {
      'content-type': 'application/json',
      Authorization: auth,
    });
    response
      .then(data => {
        setSpinner(false);
        setHasLoaded(true);
        const appModel: AppsModel = JSON.parse(JSON.stringify(data));
        var appsData: Apps[] = dataModel?.data ?? [];
        var newPageApps: Apps[] = appModel?.data ?? [];
        var totalApps: Apps[] = appsData.concat(newPageApps);
        appModel.data = totalApps;

        setDataModel(appModel);

        convertToSection(appModel);
      })
      .catch(fetchError => {
        setSpinner(false);
        setHasLoaded(true);
        setError(getUserFacingError(fetchError));
      });
  }

  /**
   * Pull-to-refresh: fetches the first page and replaces the loaded data
   * instead of concatenating. Bypasses the `getAPIData` "already loaded" guard
   * while leaving the next-token pagination contract untouched.
   */
  async function refresh() {
    const auth: string | null = await getToken();
    if (auth === null) {
      return;
    }

    setRefreshing(true);
    setError(null);
    const apiService = new ApiService(API_CONFIG.BASE_URL + API_CONFIG.API_VERSION);
    const url = API_CONFIG.endpoints.apps.list(null);
    const response = apiService.get(url, {
      'content-type': 'application/json',
      Authorization: auth,
    });
    response
      .then(data => {
        setRefreshing(false);
        setHasLoaded(true);
        const appModel: AppsModel = JSON.parse(JSON.stringify(data));
        setDataModel(appModel);
        convertToSection(appModel);
      })
      .catch(fetchError => {
        setRefreshing(false);
        setHasLoaded(true);
        setError(getUserFacingError(fetchError));
      });
  }

  function convertToSection(appModel: AppsModel | null) {
    const model = appModel;

    // Initialize the array as an array of objects where the key is a string and the value is an array of Apps
    var arrSectionData: Section[] = [];

    const allData: Apps[] = (model?.data ?? []).sort((a, b) =>
      a.owner.name.localeCompare(b.owner.name),
    );

    var currentKey = '';
    var arrData: Apps[] = [];

    allData.forEach(app => {
      if (currentKey === '') {
        currentKey = app.owner.name;
        arrData.push(app);
      } else if (currentKey === app.owner.name) {
        arrData.push(app);
      } else {
        // const obj: {[key: string]: Apps[]} = {[currentKey]: arrData};
        const sectionData: Section = {title: currentKey, data: arrData};
        arrSectionData.push(sectionData);
        currentKey = app.owner.name;
        arrData = [];
        arrData.push(app);
      }
    });

    const sectionData: Section = {title: currentKey, data: arrData};
    arrSectionData.push(sectionData);
    setSectionData(arrSectionData);
  }

  function confirmLogOut() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          clearToken()
            .then(() => {
              navigation.goBack();
            })
            .catch(clearError => {
              if (__DEV__) {
                console.error('Unable to clear the Bitrise token.', clearError);
              }
              setError('Your token could not be removed. Please try again.');
            });
        },
      },
    ]);
  }

  useEffect(() => {
    const params = route.params as {appList?: AppsModel} | undefined;
    if (params?.appList) {
      setDataModel(params.appList);
      convertToSection(params.appList);
      setHasLoaded(true);
    }
    const logOutColor = colors.accent;
    const logOutTint = typeof logOutColor === 'string' ? logOutColor : undefined;
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          accessibilityHint="Removes your saved token and returns to sign in"
          hitSlop={spacing.hitSlop}
          onPress={confirmLogOut}
          style={styleSheet.headerButton}>
          <AppIcon
            name="logout"
            size={22}
            color={logOutTint}
            accessibilityLabel="Log out"
          />
        </Pressable>
      ),
      headerLeft: () => null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, route.params, colors.accent]);

  const visibleSections = useMemo(
    () => (query ? filterSections(getSectionData, query) : getSectionData),
    [getSectionData, query],
  );

  // convertToSection always appends a trailing section, so count apps (not
  // sections) to decide whether there is anything to show.
  const visibleAppCount = useMemo(
    () => visibleSections.reduce((sum, section) => sum + section.data.length, 0),
    [visibleSections],
  );

  const isInitialLoading =
    getSpinner && (dataModel?.data ?? []).length === 0 && !refreshing;
  const hasFetchError = error != null && (dataModel?.data ?? []).length === 0;
  const isEmpty =
    hasLoaded && !hasFetchError && !isInitialLoading && visibleAppCount === 0;

  // Styles derived from theme tokens.
  const mainBackground: ViewStyle = {backgroundColor: colors.groupedBackground};
  const searchStyle: TextStyle = {
    ...type.body,
    color: colors.label,
    backgroundColor: colors.secondaryGroupedBackground,
    borderRadius: spacing.radius.md,
    paddingHorizontal: spacing.spacing.md,
    paddingVertical: spacing.spacing.sm,
    marginHorizontal: spacing.spacing.md,
    marginTop: spacing.spacing.sm,
    marginBottom: spacing.spacing.sm,
    minHeight: spacing.minTouchTarget,
  };
  const sectionHeaderStyle: ViewStyle = {
    paddingHorizontal: spacing.spacing.md,
    paddingTop: spacing.spacing.lg,
    paddingBottom: spacing.spacing.xs,
    backgroundColor: colors.groupedBackground,
  };
  const sectionHeaderTextStyle: TextStyle = {
    ...type.footnote,
    color: colors.secondaryLabel,
    textTransform: 'uppercase',
  };
  const listHeader = (
    <View>
      <TextInput
        style={searchStyle}
        value={query}
        onChangeText={setQuery}
        placeholder="Search apps"
        placeholderTextColor={colors.tertiaryLabel}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        accessibilityLabel="Search apps"
      />
    </View>
  );

  const renderItem = ({item}: {item: Apps}) => (
    <AppListRow
      app={item}
      theme={theme}
      onPress={() => {
        navigation.navigate('BuildList', {
          slug: item.slug,
        });
      }}
    />
  );

  const renderSectionHeader = ({section}: {section: Section}) => (
    <View style={sectionHeaderStyle}>
      <Text style={sectionHeaderTextStyle} allowFontScaling>
        {section.title}
      </Text>
    </View>
  );

  function renderBody() {
    if (isInitialLoading) {
      return (
        <View>
          {listHeader}
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
            getAPIData(null);
          }}
          testID="apps-error-state"
        />
      );
    }

    if (isEmpty) {
      return (
        <View style={styleSheet.emptyWrapper}>
          {listHeader}
          <EmptyState
            icon="apps"
            title={query ? 'No matches' : 'No apps yet'}
            message={
              query
                ? 'No apps match your search.'
                : 'Apps connected to your Bitrise account will show up here.'
            }
            testID="apps-empty-state"
          />
        </View>
      );
    }

    return (
      <SectionList
        sections={visibleSections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ItemSeparatorComponent={RowSeparator}
        ListHeaderComponent={listHeader}
        keyExtractor={(item, index) => item.slug ?? index.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        onEndReachedThreshold={0.2}
        onEndReached={() => {
          getAPIData(
            dataModel?.paging.next != null ? dataModel.paging.next : null,
          );
        }}
        ListFooterComponent={
          getSpinner && (dataModel?.data ?? []).length > 0 ? (
            <View style={styleSheet.footerSpinner}>
              <ActivityIndicator
                size="small"
                color={typeof colors.accent === 'string' ? colors.accent : undefined}
              />
            </View>
          ) : undefined
        }
      />
    );
  }

  return (
    <SafeAreaView style={[styleSheet.mainView, mainBackground]} edges={['bottom']}>
      {renderBody()}
    </SafeAreaView>
  );
};

const styleSheet = StyleSheet.create({
  mainView: {
    flex: 1,
    flexDirection: 'column',
  },
  rowCenter: {
    flex: 1,
  },
  emptyWrapper: {
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

export default AppList;
