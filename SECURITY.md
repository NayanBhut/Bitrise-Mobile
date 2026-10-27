# Security notes

## Bitrise token storage

The personal access token (PAT) is stored with `react-native-keychain` under the
service `com.bitrise.mobile.api-token`. On iOS the item uses
`AccessibleWhenUnlockedThisDeviceOnly`; on Android the library uses the Android
Keystore. Tokens written by older versions of the app in AsyncStorage are
migrated on first read and removed.

The token is never written to logs. API failures are converted to short,
user-safe messages instead of displaying raw server responses.

## Android release signing

The release key is local and **must not be committed**:

- `android/app/keystore/bitrise-release.jks`
- `android/keystore.properties` (contains the passwords)

Both paths are ignored by Git. Back up both files somewhere safe and offline.
If this key is lost, existing installations cannot receive updates signed with
the same identity.

For CI, add these repository secrets:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -i android/app/keystore/bitrise-release.jks` |
| `ANDROID_STORE_PASSWORD` | `storePassword` from `android/keystore.properties` |
| `ANDROID_KEY_ALIAS` | `keyAlias` from `android/keystore.properties` |
| `ANDROID_KEY_PASSWORD` | `keyPassword` from `android/keystore.properties` |

The Android workflows decode the keystore into `android/app/release.jks` and
fail closed if any signing secret is missing. They no longer produce a
debug-signed APK.

## CI hardening

- Workflows declare `permissions: contents: read`.
- Third-party actions are pinned to commit SHAs.
- Checkout steps do not persist the workflow token.
- A quality job runs TypeScript checks, Jest, ESLint, and
  `npm audit --omit=dev --audit-level=high` before builds.
- Android release builds run only on trusted events (push, schedule, or manual
  dispatch), because pull requests from forks do not receive signing secrets.
- Dependencies are installed with `npm ci`.
- Dependabot checks npm, Gradle, Bundler, and GitHub Actions weekly.

## App hardening

- Android release builds enable R8/ProGuard.
- Android sets `FLAG_SECURE`, blocking screenshots and screen recordings.
- iOS shows a privacy blur while the app is inactive, hiding content in the app
  switcher.
- The empty `NSLocationWhenInUseUsageDescription` entry and the ATS local
  networking exception were removed. Release and Debug builds have no ATS
  exception; the simulator connects to Metro over localhost without it. If you
  test on a physical device over a LAN, add a Debug-only ATS exception.

## Intentionally not added

Certificate pinning and a biometric app-lock were not added silently. Both are
operational/product decisions:

- Certificate pinning needs owned pin values, a backup pin, and a rotation plan;
  a bad pin makes the app unable to reach Bitrise. It also requires a native
  networking implementation on iOS rather than the standard `fetch` stack.
- A biometric app-lock changes launch UX and needs a fallback policy for devices
  without biometrics. The token is already protected at rest by the platform
  secure store and device-only accessibility.

## Verification performed

- `npx tsc --noEmit`
- `npm test -- --runInBand` (9 tests)
- `npm audit` (0 vulnerabilities)
- Android `assembleRelease` with R8 and release signing; APK verified with
  `apksigner` and `zipalign`
- iOS Debug and Release simulator builds; both launched successfully
- iOS token field is reported by accessibility as a secure text field
- Invalid-token request displayed the sanitized authentication error
