import React, {useCallback, useEffect, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppsModel} from '../API Calls/AppsModel';
import ApiService from '../API Calls/APIService';
import {getToken, saveToken} from '../API Calls/TokenStorage';
import {getUserFacingError} from '../API Calls/ErrorUtils';
import API_CONFIG from './APIConstants/APIConstants';
import {useTheme} from './Theme/useTheme';
import {AppIcon} from './Components/AppIcon';
import {SecureField} from './Components/SecureField';
import {SectionCard} from './Components/SectionCard';
import {PrimaryButton} from './Components/PrimaryButton';

const LoginForm = ({
  navigation,
}: {
  navigation: {navigate: (r: string, p: object) => void};
}) => {
  const {colors, type, spacing} = useTheme();
  const [token, setToken] = useState<string>('');
  const [getSpinner, setSpinner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAPIData = useCallback(
    (rawToken: string) => {
      const apiToken = rawToken.trim();
      if (!apiToken) {
        setError('Enter a Bitrise personal access token.');
        return;
      }

      setError(null);
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
            navigation.navigate('Apps List', {
              appList: appModel,
            });
          } catch (saveError) {
            if (__DEV__) {
              console.error(
                'Unable to save the Bitrise token securely.',
                saveError,
              );
            }
            setError('Your token could not be stored securely. Please try again.');
          }
        })
        .catch(fetchError => {
          setSpinner(false);
          setError(getUserFacingError(fetchError));
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

  const accent = colors.accent;

  const contentStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.spacing.lg,
  };

  const headerStyle: ViewStyle = {
    alignItems: 'center',
    marginBottom: spacing.spacing.xl,
  };

  const titleStyle: TextStyle = {
    ...type.largeTitle,
    color: colors.label,
    marginTop: spacing.spacing.md,
    textAlign: 'center',
  };

  const explanationStyle: TextStyle = {
    ...type.footnote,
    color: colors.secondaryLabel,
    marginTop: spacing.spacing.sm,
    textAlign: 'center',
  };

  const errorStyle: TextStyle = {
    ...type.footnote,
    color: colors.statusFailed,
    marginTop: spacing.spacing.sm,
  };

  const buttonWrapperStyle: ViewStyle = {
    marginTop: spacing.spacing.lg,
  };

  const hintStyle: TextStyle = {
    ...type.footnote,
    // Footnote is body-size text, so use the AA-safe link color (a darker blue
    // on light surfaces) rather than the accent tint.
    color: colors.link,
    textAlign: 'center',
    marginTop: spacing.spacing.lg,
  };

  const mainBackground: ViewStyle = {backgroundColor: colors.groupedBackground};

  return (
    <SafeAreaView style={[styles.mainView, mainBackground]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={contentStyle}>
          <View style={headerStyle}>
            <AppIcon
              name="appGlyph"
              size={64}
              color={typeof accent === 'string' ? accent : undefined}
            />
            <Text style={titleStyle} allowFontScaling>
              Welcome to Bitrise
            </Text>
            <Text style={explanationStyle} allowFontScaling>
              A personal access token lets this app securely talk to Bitrise on
              your behalf.
            </Text>
          </View>

          <SectionCard>
            <SecureField
              value={token}
              onChangeText={t => {
                setToken(t);
                setError(null);
              }}
              placeholder="Personal access token"
              returnKeyType="go"
              onSubmitEditing={() => getAPIData(token)}
              toggleAccessibilityLabel="Show or hide token"
            />
          </SectionCard>

          {error != null ? (
            <Text style={errorStyle} allowFontScaling>
              {error}
            </Text>
          ) : null}

          <View style={buttonWrapperStyle}>
            <PrimaryButton
              title="Sign In"
              loading={getSpinner}
              onPress={() => getAPIData(token)}
              accessibilityHint="Validates your token and signs you in"
              testID="sign-in-button"
            />
          </View>

          <Pressable
            accessibilityRole="link"
            accessibilityHint="Explains where to create a personal access token">
            <Text style={hintStyle} allowFontScaling>
              Create a token in Bitrise under Profile Settings → Security.
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginForm;

const styles = StyleSheet.create({
  mainView: {flex: 1},
  flex: {flex: 1},
});
