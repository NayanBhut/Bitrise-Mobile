import React from 'react';
import {Pressable, Text, TextStyle, View, ViewStyle} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type {RootStackParamList} from '../../App';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {Build} from '../../API Calls/BuildModel';
import {AppIcon} from '../Components/AppIcon';
import {statusLabel} from '../Components/StatusBadge';
import {useTheme} from '../Theme/useTheme';
import BuildHeader from './BuildHeader';
import BuildBranch from './BuildBranch';
import {formatDuration, relativeTime} from './buildTime';

export interface BuildItemData {
  item: Build;
}

interface BuildItemProps {
  buildData: BuildItemData;
  navigation: NativeStackNavigationProp<RootStackParamList, 'BuildList'>;
  route: RouteProp<RootStackParamList, 'BuildList'>;
  /** Opens the destructive abort-reason confirmation for the given build slug. */
  onAbort: (slug: string) => void;
}

/**
 * A single build rendered as an inset card: status badge + build number,
 * branch, triggered workflow, and a meta line with relative time and (for
 * finished builds) duration. Running builds (`finished_at === null`) expose a
 * destructive Abort both via a right-swipe action and a long-press, each
 * funneling into the same reason confirmation in the parent screen.
 *
 * The whole card reads as one accessibility element with a combined label.
 */
const BuildItem: React.FC<BuildItemProps> = ({
  buildData,
  navigation,
  route,
  onAbort,
}) => {
  const theme = useTheme();
  const {colors, type, spacing} = theme;
  const build = buildData.item;
  const isRunning = build.finished_at === null;

  const relative = relativeTime(build.triggered_at);
  const duration = formatDuration(build.started_on_worker_at, build.finished_at);

  const cardStyle: ViewStyle = {
    backgroundColor: colors.secondaryGroupedBackground,
    borderRadius: spacing.radius.lg,
    padding: spacing.spacing.md,
    marginHorizontal: spacing.spacing.md,
    marginVertical: spacing.spacing.sm,
    minHeight: spacing.minTouchTarget,
  };

  const workflowRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.spacing.xs,
  };
  const workflowTextStyle: TextStyle = {
    ...type.subheadline,
    color: colors.secondaryLabel,
    marginLeft: spacing.spacing.xs,
    flexShrink: 1,
  };
  const branchRowStyle: ViewStyle = {marginTop: spacing.spacing.sm};
  const metaRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.spacing.sm,
  };
  const metaTextStyle: TextStyle = {
    ...type.footnote,
    color: colors.tertiaryLabel,
  };
  const metaDotStyle: TextStyle = {
    ...type.footnote,
    color: colors.tertiaryLabel,
    marginHorizontal: spacing.spacing.sm,
  };

  const secondaryLabelColor = colors.secondaryLabel;

  const combinedLabel =
    `Build ${build.build_number}, ${statusLabel(build.status_text)}, ` +
    `branch ${build.branch}, ${relative}`;

  function openDetails() {
    navigation.navigate('BuildDetailView', {
      appSlug: route.params.slug,
      buildModel: build,
    });
  }

  const row = (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={combinedLabel}
      accessibilityHint="Opens build details"
      onPress={openDetails}
      onLongPress={isRunning ? () => onAbort(build.slug) : undefined}
      style={cardStyle}>
      <BuildHeader build={build} theme={theme} />
      <View style={branchRowStyle}>
        <BuildBranch build={build} theme={theme} />
      </View>
      <View style={workflowRowStyle}>
        <AppIcon
          name="workflow"
          size={14}
          color={
            typeof secondaryLabelColor === 'string' ? secondaryLabelColor : undefined
          }
        />
        <Text style={workflowTextStyle} numberOfLines={1} allowFontScaling>
          {build.triggered_workflow}
        </Text>
      </View>
      <View style={metaRowStyle}>
        <Text style={metaTextStyle} allowFontScaling>
          {relative}
        </Text>
        {duration ? (
          <>
            <Text style={metaDotStyle} allowFontScaling>
              ·
            </Text>
            <Text style={metaTextStyle} allowFontScaling>
              {duration}
            </Text>
          </>
        ) : null}
      </View>
    </Pressable>
  );

  if (!isRunning) {
    return row;
  }

  const onFillColor = colors.onFill;
  const abortActionStyle: ViewStyle = {
    backgroundColor: colors.destructive,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: spacing.minTouchTarget * 2,
    marginVertical: spacing.spacing.sm,
    marginRight: spacing.spacing.md,
    borderRadius: spacing.radius.lg,
    paddingHorizontal: spacing.spacing.md,
  };
  const abortLabelStyle: TextStyle = {
    ...type.footnote,
    color: colors.onFill,
    marginTop: spacing.spacing.xs,
  };

  const renderRightActions = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abort build"
      accessibilityHint="Stops this running build"
      hitSlop={spacing.hitSlop}
      onPress={() => onAbort(build.slug)}
      style={abortActionStyle}>
      <AppIcon
        name="abort"
        size={22}
        color={typeof onFillColor === 'string' ? onFillColor : undefined}
        accessibilityLabel="Abort build"
      />
      <Text style={abortLabelStyle} allowFontScaling>
        Abort
      </Text>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable renderRightActions={renderRightActions}>
      {row}
    </ReanimatedSwipeable>
  );
};

export default BuildItem;
