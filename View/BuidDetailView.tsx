import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {BuildDetailModel} from '../API Calls/BuildDetailModel';
import {AnsiText} from './AnsiText';

import {LogChunks} from '../API Calls/BuildDetailModel';
import {Build, BuildState} from '../API Calls/BuildModel';
import ApiService from '../API Calls/APIService';
import {getToken} from '../API Calls/TokenStorage';
import {getUserFacingError} from '../API Calls/ErrorUtils';
import API_CONFIG from './APIConstants/APIConstants';
import {useTheme} from './Theme/useTheme';
import {AppIcon} from './Components/AppIcon';
import {SectionCard} from './Components/SectionCard';
import {StatusBadge} from './Components/StatusBadge';
import {EmptyState} from './Components/EmptyState';
import {ErrorState} from './Components/ErrorState';
import {relativeTime, formatDuration} from './BuildListViews/buildTime';

/**
 * The runtime object navigated here is a full {@link Build}, even though the
 * App.tsx route type only declares `{slug}` (out of scope to widen). Read the
 * summary fields defensively via this partial shape.
 */
type RouteBuild = Partial<Build> & {slug: string};

/** Distance (pt) from the bottom within which we consider the log "at bottom". */
const BOTTOM_THRESHOLD = 24;

/**
 * Floating "jump to bottom" affordance. It fades in on appearance when motion
 * is allowed and renders statically (but fully functional) under Reduce Motion.
 */
function JumpToBottomButton({
  backgroundColor,
  iconColor,
  reduceMotion,
  onPress,
}: {
  backgroundColor: ViewStyle['backgroundColor'];
  iconColor?: string;
  reduceMotion: boolean;
  onPress: () => void;
}) {
  // Start transparent so the button can fade in; hooks run unconditionally.
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const animatedStyle = useAnimatedStyle(() => ({opacity: opacity.value}));

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = withTiming(1, {duration: 200});
  }, [reduceMotion, opacity]);

  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Jump to bottom"
      accessibilityHint="Scrolls to the latest log output"
      testID="jump-to-bottom"
      onPress={onPress}
      style={[styles.jumpButton, {backgroundColor}]}>
      <View style={styles.jumpIcon}>
        <AppIcon
          name="chevron"
          size={22}
          color={iconColor}
          accessibilityLabel="Jump to bottom"
        />
      </View>
    </Pressable>
  );

  if (reduceMotion) {
    return <View style={styles.jumpContainer}>{button}</View>;
  }

  return (
    <Animated.View style={[styles.jumpContainer, animatedStyle]}>
      {button}
    </Animated.View>
  );
}

const BuildDetailView = ({
  navigation,
  route,
}: {
  navigation: {setOptions: (opts: object) => void};
  route: {params: {appSlug: string; buildModel: RouteBuild}};
}) => {
  const {colors, type, spacing, reduceMotion} = useTheme();

  const [getBuildData, setBuildData] = useState<BuildDetailModel | null>(null);
  const [loader, setLoader] = useState<boolean>(false);
  const [fullLogLoading, setFullLogLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState<boolean>(true);

  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const buildModel = route.params.buildModel;

  function getLogs(_url: string) {
    setFullLogLoading(true);
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
        setFullLogLoading(false);
      })
      .catch(error => {
        setFullLogLoading(false);
        Alert.alert('Error', getUserFacingError(error));
      });
  }

  async function getBuildDetails(_appSlug: string, _buildSlug: string) {
    const auth: string | null = await getToken();
    if (auth === null) {
      return;
    }

    setErrorMsg(null);
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
        setErrorMsg(getUserFacingError(error));
      });
  }

  useEffect(() => {
    getBuildDetails(route.params.appSlug, route.params.buildModel.slug);
  }, [route.params.appSlug, route.params.buildModel.slug]);

  // Wire the header "Full Log" action. The effect re-runs whenever the build
  // data or loading state changes so the button reflects the latest log URL
  // and shows progress while fetching.
  useEffect(() => {
    const accent = colors.accent;
    const tint = typeof accent === 'string' ? accent : undefined;
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () =>
        fullLogLoading ? (
          <ActivityIndicator size="small" color={tint} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Load full log"
            accessibilityHint="Fetches the complete build log"
            hitSlop={spacing.hitSlop}
            style={styles.headerButton}
            onPress={() => {
              if (getBuildData?.expiring_raw_log_url != null) {
                getLogs(getBuildData?.expiring_raw_log_url.toString());
              } else {
                Alert.alert('Full Log', 'The full log is not available yet.');
              }
            }}>
            <AppIcon
              name="logs"
              size={22}
              color={tint}
              accessibilityLabel="Load full log"
            />
          </Pressable>
        ),
    });
    // The header action needs the latest build/log URL and loading state.
    // Re-running this effect whenever they change is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getBuildData, fullLogLoading, colors.accent]);

  const logChunks = getBuildData?.log_chunks ?? [];

  const accentColor = colors.accent;
  const accentString = typeof accentColor === 'string' ? accentColor : undefined;
  const onFill = colors.onFill;
  const onFillString = typeof onFill === 'string' ? onFill : undefined;

  function onScroll(event: {
    nativeEvent: {
      contentSize: {height: number};
      layoutMeasurement: {height: number};
      contentOffset: {y: number};
    };
  }) {
    const {contentSize, layoutMeasurement, contentOffset} = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (layoutMeasurement.height + contentOffset.y);
    setAtBottom(distanceFromBottom < BOTTOM_THRESHOLD);
  }

  function renderSummaryCard() {
    const status = buildModel.status_text;
    const buildNumber = buildModel.build_number;
    const branch = buildModel.branch;
    const workflow = buildModel.triggered_workflow;
    const started = relativeTime(buildModel.triggered_at);
    const duration = formatDuration(
      buildModel.started_on_worker_at,
      buildModel.finished_at,
    );

    const labelStyle = [type.footnote, {color: colors.secondaryLabel}];
    const valueStyle = [type.subheadline, {color: colors.label}];
    const monoValueStyle = [
      type.subheadline,
      {color: colors.label, fontFamily: type.mono},
    ];
    const rowStyle: ViewStyle = {marginBottom: spacing.spacing.sm};

    return (
      <SectionCard title="BUILD" testID="build-detail-summary">
        {Object.values(BuildState).includes(status as BuildState) ? (
          <View style={rowStyle}>
            <StatusBadge state={status as BuildState} />
          </View>
        ) : null}

        {buildNumber != null ? (
          <View style={rowStyle} accessible accessibilityLabel={`Build number ${buildNumber}`}>
            <Text style={labelStyle}>Build</Text>
            <Text style={monoValueStyle}>{`#${buildNumber}`}</Text>
          </View>
        ) : null}

        {branch ? (
          <View style={rowStyle} accessible accessibilityLabel={`Branch ${branch}`}>
            <Text style={labelStyle}>Branch</Text>
            <View style={styles.inlineRow}>
              <AppIcon name="branch" size={16} color={colors.secondaryLabel} />
              <Text style={[monoValueStyle, styles.inlineValue]}>{branch}</Text>
            </View>
          </View>
        ) : null}

        {workflow ? (
          <View style={rowStyle} accessible accessibilityLabel={`Workflow ${workflow}`}>
            <Text style={labelStyle}>Workflow</Text>
            <View style={styles.inlineRow}>
              <AppIcon name="workflow" size={16} color={colors.secondaryLabel} />
              <Text style={[valueStyle, styles.inlineValue]}>{workflow}</Text>
            </View>
          </View>
        ) : null}

        <View style={rowStyle} accessible accessibilityLabel={`Started ${started}`}>
          <Text style={labelStyle}>Started</Text>
          <Text style={valueStyle}>{started}</Text>
        </View>

        {duration !== '' ? (
          <View accessible accessibilityLabel={`Duration ${duration}`}>
            <Text style={labelStyle}>Duration</Text>
            <Text style={valueStyle}>{duration}</Text>
          </View>
        ) : null}
      </SectionCard>
    );
  }

  function renderLogBody() {
    if (loader) {
      return (
        <View style={styles.viewIndicator}>
          <ActivityIndicator size="small" color={accentString} />
        </View>
      );
    }

    if (errorMsg != null) {
      return (
        <ErrorState
          message={errorMsg}
          onRetry={() => {
            setErrorMsg(null);
            getBuildDetails(route.params.appSlug, route.params.buildModel.slug);
          }}
          testID="build-detail-error-state"
        />
      );
    }

    if (logChunks.length === 0) {
      return (
        <EmptyState
          icon="logs"
          title="No logs yet"
          message="This build hasn't produced any log output."
          testID="build-detail-empty-state"
        />
      );
    }

    const logSurfaceStyle: ViewStyle = {
      flex: 1,
      backgroundColor: colors.secondaryBackground,
      borderRadius: spacing.radius.md,
      padding: spacing.spacing.sm,
      marginTop: spacing.spacing.sm,
    };

    const logTextStyle = {
      fontFamily: type.mono,
      fontSize: type.footnote.fontSize,
    };

    return (
      <View style={logSurfaceStyle}>
        <ScrollView
          ref={scrollViewRef}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onContentSizeChange={() => {
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollToEnd({animated: false});
            }
          }}>
          {logChunks.map((line, index) => (
            <AnsiText
              key={`k-${index}`}
              textStyle={logTextStyle}
              containerStyle={logTextStyle}
              selectable
              ansi={(logChunks[index].chunk ?? '').toString()}
            />
          ))}
        </ScrollView>

        {!atBottom ? (
          <JumpToBottomButton
            backgroundColor={colors.accent as ViewStyle['backgroundColor']}
            iconColor={onFillString}
            reduceMotion={reduceMotion}
            onPress={() =>
              scrollViewRef.current?.scrollToEnd({animated: !reduceMotion})
            }
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.superView, {backgroundColor: colors.groupedBackground}]}>
      <View style={[styles.content, {padding: spacing.spacing.md}]}>
        {renderSummaryCard()}
        {renderLogBody()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  superView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  viewIndicator: {
    flex: 1,
    justifyContent: 'center',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineValue: {
    marginLeft: 6,
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  jumpContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  jumpButton: {
    minWidth: 44,
    minHeight: 44,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpIcon: {
    // Rotate the right-chevron to point downward ("jump to bottom").
    transform: [{rotate: '90deg'}],
  },
});

export default BuildDetailView;
