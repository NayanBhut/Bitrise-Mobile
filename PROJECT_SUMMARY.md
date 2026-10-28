# BitriseMobile — Project Summary

An unofficial **Bitrise CI client** for Android and iOS, built with **React Native + TypeScript**. It lets a developer sign in with a Bitrise personal access token (PAT) and manage their CI apps and builds from a phone.

## Tech Stack

- **React Native 0.88**, **React 19**, **TypeScript**
- **React Navigation** (native stack) for screen flow
- **react-native-keychain** for secure token storage; **AsyncStorage** used only to migrate/clean up legacy tokens
- **anser** for rendering ANSI color codes in build logs
- Supporting libs: `react-native-gesture-handler`, `react-native-reanimated`, `react-native-safe-area-context`, `react-native-screens`
- Tooling: ESLint, Prettier, Jest, GitHub Actions (Android/iOS build workflows + CodeQL)

## App Flow (Screens)

The navigation stack is defined in `App.tsx`:

1. **LoginForm** (`View/TokenForm.tsx`) — Enter a Bitrise PAT. On launch it auto-loads a saved token from the keychain and skips straight to the app list if one exists. Token input is masked with a show/hide toggle.
2. **Apps List** (`View/AppList.tsx`) — Fetches apps across workspaces, groups them into a `SectionList` by owner name, supports pagination, and has a Log Out button that clears the stored token.
3. **BuildList** (`View/BuildLists.tsx`) — Lists builds for an app with infinite scroll pagination, color-coded status indicators, a **Trigger Build** action, and per-build **Abort** support.
4. **BuildDetailView** (`View/BuidDetailView.tsx`) — Shows build logs rendered with ANSI colors (`View/AnsiText.tsx`), auto-scrolls to the end, and can fetch the full raw log on demand.

## Key Features

- Multi-workspace app listing with pagination
- Build listing with status colors (success, failed, aborted, in-progress, on-hold)
- Trigger builds with a custom branch, workflow ID, and masked custom env-var key/value pairs (`View/BuildTriggerModal/BuildTriggerModal.tsx`)
- Abort running builds with a reason
- View and fetch full build logs

## Architecture

### `API Calls/` — data layer

| File | Responsibility |
|------|----------------|
| `APIService.tsx` | Generic fetch-based HTTP client (GET/POST/PUT/DELETE) with JSON handling and error wrapping |
| `TokenStorage.ts` | Keychain-backed token get/save/clear with legacy AsyncStorage migration |
| `ErrorUtils.ts` | `ApiError` class and `getUserFacingError()` that maps status codes to safe, user-friendly messages |
| `AppsModel.tsx` | TypeScript interfaces for the apps API response |
| `BuildModel.tsx` | Interfaces + `BuildState` enum for build list responses |
| `BuildDetailModel.tsx` | Interfaces for build log/detail responses |
| `BranchModel.tsx` | Interfaces for branch data |

### `View/` — UI layer

- Screen components organized per feature (`AppList`, `BuildLists`, `BuidDetailView`, `TokenForm`)
- `BuildListViews/` — row sub-components (`BuildItem`, `BuildHeader`, `BuildBranch`)
- `BuildTriggerModal/` — modal for triggering/aborting builds
- `AnsiText.tsx` — renders ANSI-colored log output
- `APIConstants/APIConstants.tsx` — centralizes the Bitrise base URL (`https://api.bitrise.io/v0.1/`) and all endpoint builders (apps list, builds list, trigger, abort, logs)

### `__tests__/`

Jest tests for the app (`App.test.tsx`) and token storage (`TokenStorage.test.ts`).

## API Integration

All requests go to the Bitrise REST API v0.1. Endpoints are centralized in `APIConstants.tsx`:

- `GET apps?limit=20[&next=...]` — list apps
- `GET apps/{appSlug}/builds?limit=20[&next=...]` — list builds
- `POST apps/{appSlug}/builds` — trigger a build
- `POST apps/{appSlug}/builds/{buildSlug}/abort` — abort a build
- `GET apps/{appSlug}/builds/{buildSlug}/log` — fetch build logs

Authentication is via the `Authorization` header carrying the user's PAT.

## Security-Conscious Design

- Tokens are stored in the platform keychain (`ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY`), not in plain storage
- The trigger modal wipes all secret state when closed and masks custom env-var values by default
- Error messages are sanitized via `getUserFacingError()` before display — raw server responses and stack traces are never shown
- Token input fields disable autofill, autocomplete, autocorrect, and spellcheck

## Getting Started

```sh
npm install        # install JS dependencies
# install CocoaPods for iOS (bundle exec pod install in ios/)
npm run android    # run on Android
npm run ios        # run on iOS
```

Other scripts: `npm run lint`, `npm test`, `npm start`, `npm run audit`.

## CI/CD

GitHub Actions workflows under `.github/workflows/`:

- `android_Build.yml` — Android build
- `iOS_Build.yml` — iOS build
- `build.yml` — combined Android + iOS build
- `codeql.yml` — CodeQL security analysis

Dependabot is configured via `.github/dependabot.yml`.
