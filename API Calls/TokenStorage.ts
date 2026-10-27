import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const TOKEN_SERVICE = 'com.bitrise.mobile.api-token';
const TOKEN_USERNAME = 'bitrise';
const LEGACY_TOKEN_KEY = 'token';

/**
 * Reads the Bitrise PAT from the platform secure store.
 *
 * Older versions of the app stored the token in AsyncStorage. If a legacy
 * token is found it is moved into the Keychain and removed from AsyncStorage.
 */
export async function getToken(): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: TOKEN_SERVICE,
    });

    if (credentials) {
      // Best-effort cleanup of tokens written by older app versions. A failure
      // here must not hide the valid keychain token.
      try {
        await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
      } catch (error) {
        if (__DEV__) {
          console.error('Unable to remove the legacy Bitrise token.', error);
        }
      }
      return credentials.password;
    }

    const legacyToken = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacyToken === null) {
      return null;
    }

    await saveToken(legacyToken);
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
    return legacyToken;
  } catch (error) {
    if (__DEV__) {
      console.error('Unable to read the stored Bitrise token.', error);
    }
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  const result = await Keychain.setGenericPassword(TOKEN_USERNAME, token, {
    service: TOKEN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });

  if (result === false) {
    throw new Error('The platform secure store rejected the token.');
  }

  // Remove any token left behind by a previous app version. This is
  // best-effort: the token is already safely stored in the keychain.
  try {
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch (error) {
    if (__DEV__) {
      console.error('Unable to remove the legacy Bitrise token.', error);
    }
  }
}

export async function clearToken(): Promise<void> {
  const [legacyResult, keychainResult] = await Promise.allSettled([
    AsyncStorage.removeItem(LEGACY_TOKEN_KEY),
    Keychain.resetGenericPassword({service: TOKEN_SERVICE}),
  ]);

  // If either store still contains the token, logout must report a failure so
  // the user does not believe the token was removed when it can be read again.
  if (legacyResult.status === 'rejected') {
    throw legacyResult.reason;
  }
  if (keychainResult.status === 'rejected') {
    throw keychainResult.reason;
  }
}
