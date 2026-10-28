import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import RNHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';
import ApiService from '../../API Calls/APIService';
import {getToken} from '../../API Calls/TokenStorage';
import {getUserFacingError} from '../../API Calls/ErrorUtils';
import API_CONFIG from '../APIConstants/APIConstants';
import {useTheme} from '../Theme/useTheme';
import {AppIcon} from '../Components/AppIcon';
import {SectionCard} from '../Components/SectionCard';
import {SecureField} from '../Components/SecureField';
import {PrimaryButton} from '../Components/PrimaryButton';
import {SecondaryButton} from '../Components/SecondaryButton';
import {DestructiveButton} from '../Components/DestructiveButton';

export interface CustomKeyModel {
  id: string;
  keyName: string;
  keyValue: string;
}

type BuildTriggerModalProps = {
  slug: string;
  visible: boolean;
  isAbortVisible: boolean;
  abortBuild: (abort: boolean, reason: string) => void;
  cancel: (status: boolean) => void;
};

const MASK = '••••••••';

const BuildTriggerModal = (props: BuildTriggerModalProps) => {
  const {colors, type, spacing, reduceMotion} = useTheme();
  const {height} = useWindowDimensions();

  const [data, setData] = useState<CustomKeyModel[]>([]);
  const [keyName, setKeyName] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [editingItem, setEditingItem] = useState<CustomKeyModel | null>(null);
  const [branchName, setBranchName] = useState('');
  const [workFlowValue, setWorkFlowValue] = useState('');
  const [abortReason, setAbortReason] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const wasVisible = useRef(false);

  // Local Reduce Transparency detection. The sheet surface is solid by
  // construction, so this only documents that no blur material is introduced.
  const [reduceTransparency, setReduceTransparency] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled?.().then(enabled => {
      if (mounted) {
        setReduceTransparency(enabled);
      }
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  // Keep secrets out of component state once the modal is closed.
  useEffect(() => {
    const isVisible = props.visible || props.isAbortVisible;
    if (wasVisible.current && !isVisible) {
      setData([]);
      setKeyName('');
      setKeyValue('');
      setEditingItem(null);
      setBranchName('');
      setWorkFlowValue('');
      setAbortReason('');
      setRevealedKeys({});
    }
    wasVisible.current = isVisible;
  }, [props.visible, props.isAbortVisible]);

  // Add new data
  const addData = () => {
    if (!keyName || !keyValue) {
      Alert.alert('Error', 'Please provide both Key Name and Key Value');
      return;
    }

    const newData: CustomKeyModel = {
      id: Math.random().toString(),
      keyName: keyName,
      keyValue: keyValue,
    };

    setData(prevData => [...prevData, newData]);
    resetForm();
  };

  // Edit existing data
  const editData = (item: CustomKeyModel) => {
    setEditingItem(item);
    setKeyName(item.keyName);
    setKeyValue(item.keyValue);
  };

  // Save edited data
  const saveEditedData = () => {
    if (!keyName || !keyValue) {
      Alert.alert('Error', 'Please provide both Key Name and Key Value');
      return;
    }

    const updatedData = data.map(item =>
      item.id === editingItem?.id ? {...item, keyName, keyValue} : item,
    );

    setData(updatedData);
    resetForm();
  };

  // Remove an env var row.
  const removeData = (item: CustomKeyModel) => {
    setData(previous => previous.filter(entry => entry.id !== item.id));
    setRevealedKeys(previous => {
      const next = {...previous};
      delete next[item.id];
      return next;
    });
    if (editingItem?.id === item.id) {
      resetForm();
    }
  };

  // Reset form fields
  const resetForm = () => {
    setKeyName('');
    setKeyValue('');
    setEditingItem(null); // Reset editing state
  };

  const isTriggerValid =
    branchName.trim() !== '' && workFlowValue.trim() !== '';

  async function triggerBuid() {
    const auth: string | null = await getToken();
    if (auth === null) {
      return;
    }

    const arrEnvData = data.map(item => {
      return {
        mapped_to: item.keyName,
        value: item.keyValue,
        is_expand: true,
      };
    });

    const objTrigger = {
      hook_info: {
        type: 'bitrise',
      },
      build_params: {
        branch: branchName,
        workflow_id: workFlowValue,
        environments: arrEnvData,
      },
    };
    const url = API_CONFIG.endpoints.builds.trigger(props.slug);
    const apiService = new ApiService(API_CONFIG.BASE_URL + API_CONFIG.API_VERSION);

    apiService
      .post(url, objTrigger, {
        'content-type': 'application/json',
        Authorization: auth,
      })
      .then(response => {
        var result = JSON.parse(JSON.stringify(response));
        if (result.status !== 'error') {
          RNHapticFeedback.trigger(HapticFeedbackTypes.notificationSuccess, {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false,
          });
        }
        const message =
          result.status === 'error'
            ? 'The build could not be triggered. Check the branch, workflow, and environment values.'
            : 'Build Triggered';
        Alert.alert('Build', message, [
          {
            text: 'OK',
            onPress: () => {
              props.cancel(true);
            },
          },
        ]);
      })
      .catch(error => {
        Alert.alert('Error', getUserFacingError(error));
      });
  }

  const confirmAbort = () => {
    RNHapticFeedback.trigger(HapticFeedbackTypes.notificationWarning, {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    props.abortBuild(true, abortReason);
  };

  // The sheet surface is always solid; when Reduce Transparency is on we keep
  // the scrim fully opaque (no translucent material) for the same guarantee.
  const styles = useMemo(
    () =>
      createStyles({
        colors,
        type,
        spacing,
        maxHeight: height * 0.9,
        solidScrim: reduceTransparency,
      }),
    [colors, type, spacing, height, reduceTransparency],
  );

  const plainInputStyle: TextStyle = {
    ...type.body,
    minHeight: spacing.minTouchTarget,
    borderRadius: spacing.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    backgroundColor: colors.secondaryGroupedBackground,
    paddingHorizontal: spacing.spacing.md,
    paddingVertical: spacing.spacing.sm,
    color: colors.label,
  };

  return (
    <Modal
      visible={props.visible || props.isAbortVisible}
      animationType={reduceMotion ? 'none' : 'slide'}
      transparent={true}>
      <View style={styles.scrim}>
        <View style={styles.sheet} testID="trigger-modal">
          <View style={styles.grabHandle} accessible={false} />
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {props.isAbortVisible ? (
              <>
                <Text style={styles.header}>Add abort reason</Text>
                <SectionCard title="REASON">
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    spellCheck={false}
                    style={plainInputStyle}
                    placeholder="Please add reason"
                    placeholderTextColor={colors.tertiaryLabel}
                    value={abortReason}
                    onChangeText={setAbortReason}
                    accessibilityLabel="Abort reason"
                    testID="abort-reason-input"
                  />
                </SectionCard>

                <View style={styles.buttonRow}>
                  <View style={styles.buttonSlot}>
                    <SecondaryButton
                      title="Cancel"
                      testID="cancel-button"
                      accessibilityHint="Dismisses without aborting the build"
                      onPress={() => props.abortBuild(false, abortReason)}
                    />
                  </View>
                  <View style={styles.buttonSlot}>
                    <DestructiveButton
                      title="Abort Build"
                      testID="abort-build-button"
                      accessibilityHint="Aborts the running build"
                      onPress={confirmAbort}
                    />
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.header}>Build Configuration</Text>

                <SectionCard title="BRANCH">
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    spellCheck={false}
                    style={plainInputStyle}
                    placeholder="Branch name"
                    placeholderTextColor={colors.tertiaryLabel}
                    value={branchName}
                    onChangeText={setBranchName}
                    accessibilityLabel="Branch name"
                    testID="branch-input"
                  />
                </SectionCard>

                <SectionCard title="WORKFLOW ID">
                  <TextInput
                    autoCapitalize="none"
                    spellCheck={false}
                    style={plainInputStyle}
                    placeholder="Workflow ID"
                    placeholderTextColor={colors.tertiaryLabel}
                    value={workFlowValue}
                    onChangeText={setWorkFlowValue}
                    accessibilityLabel="Workflow ID"
                    testID="workflow-input"
                  />
                </SectionCard>

                <SectionCard title="ENVIRONMENT VARIABLES">
                  <TextInput
                    style={[plainInputStyle, styles.stackedInput]}
                    placeholder="Enter key name"
                    placeholderTextColor={colors.tertiaryLabel}
                    value={keyName}
                    onChangeText={setKeyName}
                    accessibilityLabel="Environment variable key name"
                    testID="env-key-name-input"
                  />
                  <SecureField
                    style={styles.stackedInput}
                    placeholder="Enter key value"
                    value={keyValue}
                    onChangeText={setKeyValue}
                    testID="env-key-value"
                    accessibilityLabel="Environment variable value"
                    toggleAccessibilityLabel="Show or hide the entered value"
                  />
                  <SecondaryButton
                    title={editingItem ? 'Save Changes' : 'Add Custom Key'}
                    testID="add-env-button"
                    accessibilityHint="Adds the environment variable to the build"
                    onPress={editingItem ? saveEditedData : addData}
                  />

                  {data.map(item => {
                    const revealed = revealedKeys[item.id];
                    return (
                      <View key={item.id} style={styles.envRow}>
                        <Text
                          style={styles.envRowText}
                          numberOfLines={1}
                          {...type.dynamicType}>
                          {item.keyName}: {revealed ? item.keyValue : MASK}
                        </Text>
                        <View style={styles.envRowActions}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={
                              revealed
                                ? `Hide value for ${item.keyName}`
                                : `Show value for ${item.keyName}`
                            }
                            testID={`reveal-toggle-${item.id}`}
                            hitSlop={spacing.hitSlop}
                            style={styles.iconButton}
                            onPress={() =>
                              setRevealedKeys(previous => ({
                                ...previous,
                                [item.id]: !previous[item.id],
                              }))
                            }>
                            <AppIcon
                              name={revealed ? 'hide' : 'show'}
                              size={20}
                            />
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Edit ${item.keyName}`}
                            accessibilityHint="Loads this variable into the form for editing"
                            testID={`edit-env-${item.id}`}
                            hitSlop={spacing.hitSlop}
                            style={styles.iconButton}
                            onPress={() => editData(item)}>
                            <AppIcon name="envVar" size={20} />
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${item.keyName}`}
                            accessibilityHint="Removes this variable from the build"
                            testID={`remove-env-${item.id}`}
                            hitSlop={spacing.hitSlop}
                            style={styles.iconButton}
                            onPress={() => removeData(item)}>
                            <AppIcon
                              name="abort"
                              size={20}
                              color={colorToString(colors.destructive)}
                            />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </SectionCard>

                <View style={styles.buttonRow}>
                  <View style={styles.buttonSlot}>
                    <SecondaryButton
                      title="Cancel"
                      testID="cancel-button"
                      accessibilityHint="Dismisses the build configuration sheet"
                      onPress={() => props.cancel(false)}
                    />
                  </View>
                  <View style={styles.buttonSlot}>
                    <PrimaryButton
                      title="Start Build"
                      testID="start-build-button"
                      disabled={!isTriggerValid}
                      accessibilityHint="Triggers a new build with the entered configuration"
                      onPress={triggerBuid}
                    />
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/**
 * AppIcon's `color` prop expects a string on iOS. Theme tokens may be an
 * OpaqueColorValue (PlatformColor); fall back to undefined so the icon uses
 * its default tint when a non-string token is supplied.
 */
function colorToString(token: unknown): string | undefined {
  return typeof token === 'string' ? token : undefined;
}

type StyleArgs = {
  colors: ReturnType<typeof useTheme>['colors'];
  type: ReturnType<typeof useTheme>['type'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  maxHeight: number;
  solidScrim: boolean;
};

function createStyles({colors, type, spacing, maxHeight, solidScrim}: StyleArgs) {
  const header: TextStyle = {
    ...type.title2,
    color: colors.label,
    marginBottom: spacing.spacing.md,
  };

  const sheet: ViewStyle = {
    width: '100%',
    maxHeight,
    backgroundColor: colors.secondaryGroupedBackground,
    borderTopLeftRadius: spacing.radius.lg,
    borderTopRightRadius: spacing.radius.lg,
    paddingTop: spacing.spacing.sm,
  };

  return StyleSheet.create({
    scrim: {
      flex: 1,
      justifyContent: 'flex-end',
      // Solid (non-blur) dim. When Reduce Transparency is on we use the opaque
      // base background; otherwise a subtle fill token. Never a blur material.
      backgroundColor: solidScrim ? colors.background : colors.fill,
    },
    sheet,
    grabHandle: {
      alignSelf: 'center',
      width: 36,
      height: 5,
      borderRadius: spacing.radius.sm,
      backgroundColor: colors.tertiaryLabel,
      marginBottom: spacing.spacing.sm,
    },
    scrollContent: {
      padding: spacing.spacing.md,
      gap: spacing.spacing.md,
    },
    header,
    stackedInput: {
      marginBottom: spacing.spacing.sm,
    },
    envRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
      marginTop: spacing.spacing.sm,
    },
    envRowText: {
      ...type.body,
      color: colors.label,
      flexShrink: 1,
      marginRight: spacing.spacing.sm,
    },
    envRowActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      minWidth: spacing.minTouchTarget,
      minHeight: spacing.minTouchTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    buttonSlot: {
      flex: 1,
      marginHorizontal: spacing.spacing.xs,
    },
  });
}

export default BuildTriggerModal;
