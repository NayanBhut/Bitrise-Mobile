import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {clearToken, getToken, saveToken} from '../API Calls/TokenStorage';
import {ApiError, getUserFacingError} from '../API Calls/ErrorUtils';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
  },
  STORAGE_TYPE: {
    AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth',
  },
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

const mockedAsyncStorage = jest.mocked(AsyncStorage);
const mockedKeychain = jest.mocked(Keychain);

describe('TokenStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an existing keychain token and removes a legacy token', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue({
      username: 'bitrise',
      password: 'secure-token',
      service: 'com.bitrise.mobile.api-token',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });

    await expect(getToken()).resolves.toBe('secure-token');
    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('migrates a legacy AsyncStorage token into the keychain', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue(false);
    mockedAsyncStorage.getItem.mockResolvedValue('legacy-token');
    mockedKeychain.setGenericPassword.mockResolvedValue({
      service: 'com.bitrise.mobile.api-token',
      storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
    });

    await expect(getToken()).resolves.toBe('legacy-token');
    expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
      'bitrise',
      'legacy-token',
      expect.objectContaining({
        service: 'com.bitrise.mobile.api-token',
        accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
      }),
    );
    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('returns null when no token is stored', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue(false);
    mockedAsyncStorage.getItem.mockResolvedValue(null);

    await expect(getToken()).resolves.toBeNull();
  });

  it('throws when the secure store rejects a token', async () => {
    mockedKeychain.setGenericPassword.mockResolvedValue(false);

    await expect(saveToken('new-token')).rejects.toThrow(
      'The platform secure store rejected the token.',
    );
  });

  it('clears both the keychain item and the legacy token', async () => {
    mockedKeychain.resetGenericPassword.mockResolvedValue(true);

    await clearToken();

    expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('token');
    expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({
      service: 'com.bitrise.mobile.api-token',
    });
  });
});

describe('getUserFacingError', () => {
  it('maps authentication failures to a safe message', () => {
    expect(getUserFacingError(new ApiError(401, 'raw server text'))).toBe(
      'Your Bitrise token is invalid or expired. Please sign in again.',
    );
  });

  it('hides raw 5xx responses', () => {
    expect(getUserFacingError(new ApiError(502, 'upstream secret'))).toBe(
      'Bitrise is temporarily unavailable. Please try again later.',
    );
  });

  it('does not expose unknown errors', () => {
    expect(getUserFacingError(new Error('stack trace detail'))).toBe(
      'Something went wrong. Check your connection and try again.',
    );
  });
});
