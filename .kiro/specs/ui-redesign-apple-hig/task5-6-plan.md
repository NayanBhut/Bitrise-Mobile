# Tasks 5 & 6 — Implementation Plan: LoginForm + Apps List redesign

UI-only refactor on branch `feature/ui-redesign-apple-hig` (already checked out; **no worktree**).
Repo root: `/Users/siddharthpatel/Documents/Siddharth/iOS Project/BitriseMobile`.

Scope: refactor exactly two screens in place — `View/TokenForm.tsx` (task 5, LoginForm) and
`View/AppList.tsx` (task 6, Apps List) — to consume the theme + shared components built in
tasks 1–4, add the four network-screen states to Apps List, and keep lint/tests green. Add
lightweight render tests for both screens. Do **NOT** touch `BuildLists.tsx`,
`BuidDetailView.tsx`, `BuildTriggerModal/*`, `AnsiText.tsx`, `BuildListViews/*`, anything in
`API Calls/`, `View/APIConstants/APIConstants.tsx`, navigation route names (`LoginForm`,
`Apps List`, `BuildList`, `BuildDetailView`), or any file name.

---

## Grounding findings (from reading the real code)

### Reusable building blocks (tasks 1–4, confirmed present)
- `View/Theme/useTheme.ts` → `{ colors, type, spacing, scheme, reduceMotion, boldText }`.
  - `spacing` is the module namespace: `spacing.spacing.{xs,sm,md,lg,xl}`,
    `spacing.radius.{sm,md,lg}`, `spacing.minTouchTarget` (44), `spacing.maxContentWidth` (700).
  - `type` is the typography module: `type.largeTitle/title2/headline/body/callout/
    subheadline/footnote/caption`, `type.mono`, `type.dynamicType` (spread onto `<Text>`).
- `View/Theme/colors.ts` tokens: `background`, `secondaryBackground`, `groupedBackground`,
  `secondaryGroupedBackground`, `label`, `secondaryLabel`, `tertiaryLabel`, `separator`,
  `fill`, `accent`, status tokens, `destructive`, `onFill`. **No new tokens needed.**
  Tokens are `string | OpaqueColorValue`; when a raw string color is required (e.g. the
  `AppIcon color` / `tintColor` prop takes a hex string on iOS), guard with
  `typeof token === 'string' ? token : undefined` — the same pattern `ListRow`/`EmptyState`/
  `ErrorState` already use.
- `View/Theme/icons.ts` names needed, all confirmed present: `appGlyph`
  (`hammer.circle.fill`), `token` (`key.fill`), `show`/`hide`, `apps` (`square.stack.3d.up`),
  `chevron`, `logout` (`rectangle.portrait.and.arrow.right`), `empty`, `error`. **No new icons.**
- `View/Components/`:
  - `SecureField` — masked `TextInput` + eye toggle; hard-sets `secureTextEntry`,
    `autoComplete="off"`, `autoCorrect={false}`, `spellCheck={false}`,
    `importantForAutofill="no"`, `textContentType="none"`, `autoCapitalize="none"`. Accepts all
    other `TextInputProps` (value, onChangeText, placeholder, keyboardType,
    onSubmitEditing, returnKeyType, editable, etc.) plus `toggleAccessibilityLabel`. Toggle has
    `testID="secure-field-toggle"`.
  - `SectionCard` — `{ title?, footer?, children, style?, testID? }`; rounded
    `secondaryGroupedBackground` surface, `maxWidth: maxContentWidth`, centered.
  - `PrimaryButton` / `SecondaryButton` / `DestructiveButton` — wrap `BaseButton`
    `{ title, onPress, loading?, disabled?, accessibilityHint?, testID? }`. `BaseButton`
    enforces 44pt target, loading spinner (replaces label), light-impact haptic on press,
    `accessibilityRole="button"`, `accessibilityState={{disabled, busy}}`.
  - `ListRow` — `{ title, subtitle?, leadingIcon?: IconName, accessory?: ReactNode, onPress?,
    accessibilityHint?, testID?, style? }`. Combined a11y label = `title` + (`, subtitle`),
    `accessibilityRole="button"` only when `onPress` set, default `chevron` accessory when
    pressable. **Note:** `leadingIcon` is an `IconName` enum only — it renders an `AppIcon`,
    **not** an image URL. App avatar images therefore go through the `accessory`/custom path or
    a small wrapper, not `leadingIcon` (see Decision D6).
  - `EmptyState` — `{ icon?, title, message?, actionTitle?, onAction?, actionVariant?, testID? }`.
  - `ErrorState` — `{ message, onRetry, retryTitle?, retryVariant?, testID? }`; renders ONLY
    the `message` string passed in (always `getUserFacingError()` output) + Retry button.
  - `SkeletonRow` — `{ lines?: 1 | 2, testID?, style? }`; shimmer, static under reduceMotion.
  - `AppIcon` — `{ name: IconName, size?, weight?, scale?, color?: string, rendering?, effect?,
    accessibilityLabel? }`; decorative unless `accessibilityLabel` is set.

### Data layer (must be used exactly as today — do NOT modify these files)
- `API Calls/TokenStorage.ts` → `getToken(): Promise<string|null>`,
  `saveToken(token): Promise<void>`, `clearToken(): Promise<void>`.
- `API Calls/APIService.tsx` → `class ApiService(baseURL)` with `.get(url, headers)`.
- `API Calls/ErrorUtils.ts` → `getUserFacingError(error): string` (+ `ApiError`).
- `API Calls/AppsModel.tsx` → `AppsModel { data: Apps[]; paging: Paging }`,
  `Apps { slug, title, project_type, owner: { name }, avatar_url, ... }`,
  `Paging { next: string }`.
- `View/APIConstants/APIConstants.tsx` → `API_CONFIG.endpoints.apps.list(next)`, `BASE_URL`,
  `API_VERSION`. (Note `paging.next` is typed `string`, non-nullable; current AppList reads it
  as `dataModel?.paging.next != null` — preserve that exact guard.)

### Navigation reality — CRITICAL for task 6
- `App.tsx` builds the stack with `@react-navigation/stack` (JS stack, `createStackNavigator`).
  `@react-navigation/native-stack` is **NOT installed** (`node_modules/@react-navigation/`
  has `stack`, `native`, `elements`, `core`, `routers` — no `native`-stack).
- The JS `@react-navigation/stack` has **no `headerLargeTitle` option** — that is a
  native-stack / `react-native-screens` feature. Options like `headerRight`, `headerLeft`,
  `headerTitle`, `headerSearchBarOptions` behave differently or are unsupported on the JS stack.
- **Decision (D1):** do NOT add a dependency and do NOT change `App.tsx`'s navigator type
  (installing/converting to native-stack is outside this UI-only, two-file scope and would
  touch route wiring). Implement the "collapsing large title" as an **in-screen large title**
  that scrolls with the `SectionList` (render `largeTitle` "Apps" as the list
  `ListHeaderComponent`, or a sticky-ish in-content header), and set
  `navigation.setOptions({ headerTitle: 'Apps List' /* existing */ })` unchanged. The search
  field lives in-screen directly under the large title (not in a native header search bar,
  which the JS stack can't render). The true native large-title collapse is deferred to the
  BuildList/native-stack migration and is called out in the **manual checklist** below as
  simulator-only / not achievable without a navigator change.
- Log Out stays a **header button** via `navigation.setOptions({ headerRight })` (JS stack
  supports `headerRight`), now styled/triggered to show a destructive confirmation; keep the
  existing `// eslint-disable-next-line react/no-unstable-nested-components` comment above the
  `headerRight` arrow so no new lint warning is introduced.

### Baselines (must not regress)
- `npm test` = **14 suites / 51 tests passing** (verified).
- `npm run lint` = **0 errors, 5 warnings** (3 in `View/BuildLists.tsx`, 2 in
  `View/RadioButton.tsx`) (verified). The two screens must contribute **0 new** warnings.
  Watch `react-native/no-inline-styles`: keep style objects as typed `ViewStyle`/`TextStyle`
  variables or `StyleSheet.create` entries — never inline literal `{...}` style objects in JSX.

---

## Design decisions (rationale)

- **D1 — Large title without native-stack** (see above): in-screen large title + in-screen
  search; no navigator change, no new dependency. True native collapse deferred and flagged
  in the manual checklist.
- **D2 — Inline errors replace Alerts (both screens).** TokenForm holds an `error: string|null`
  state; on `.catch` it sets `error = getUserFacingError(error)` and renders it under the
  SecureField in `colors.statusFailed` (`type.footnote`). The keychain-save failure path
  (currently a separate Alert) also becomes an inline error string (a fixed sanitized sentence,
  not a raw error). AppList fetch failures drive the full-screen `ErrorState` (also
  `getUserFacingError()`), replacing its `Alert.alert('Error', ...)`. Only the Log Out
  destructive confirmation stays an `Alert` (by design — it is a confirmation, not an error).
- **D3 — Loading state is in-button, not a full-screen overlay (TokenForm).** The current
  `getSpinner` absolute-overlay `ActivityIndicator` is replaced by `PrimaryButton`'s own
  `loading` prop. Auto-login on mount sets the same `loading` so the button shows progress
  during silent validation.
- **D4 — Four Apps List states derived from existing state, no fetch-logic change.** Keep
  `dataModel`, `getSectionData`, and the `getAPIData(next)` pagination exactly as-is. Add:
  `error: string|null` (set in `.catch`), and derive the state at render time:
  - **loading**: initial load only — `getSpinner === true && (dataModel?.data ?? []).length === 0`
    → render a list of `SkeletonRow`s.
  - **error**: `error != null && no loaded data` → `ErrorState` with Retry calling
    `getAPIData(null)` after clearing `error`.
  - **empty**: not loading, no error, `getSectionData.length === 0` (and a load has completed)
    → `EmptyState` (icon `apps`, friendly copy).
  - **content**: the `SectionList`. The existing bottom-of-list spinner (pagination) and
    pull-to-refresh spinner remain visible over the content state.
  This preserves R1/R9 without altering the next-token fetch.
- **D5 — Local search filters loaded data only.** Add `query: string` state. Derive the
  sections passed to `SectionList` from `convertToSection`'s output filtered client-side by
  `title`/`owner.name` containing `query` (case-insensitive). Search does **not** call the API
  or touch pagination (R10). Implement the filter as a pure helper over the already-grouped
  `Section[]` (or re-group a filtered `Apps[]`) so `onEndReached` still uses the unfiltered
  `dataModel.paging.next`.
- **D6 — App avatar vs symbol fallback.** `Apps.avatar_url` is `any` and in practice usually
  null for Bitrise apps. Since `ListRow.leadingIcon` only accepts an `IconName` (renders an
  `AppIcon`, not an image), render each row as a `ListRow` with `leadingIcon="apps"` as the
  fallback by default; when `item.avatar_url` is a non-empty string, pass a small leading
  `<Image>` via a thin wrapper row (either a local `AppRow` component that renders `<Image>` +
  reuses `ListRow` styling, or `ListRow` with a custom leading via `accessory` is not leading —
  so use the `AppRow` wrapper approach). Simplest correct approach: keep using `ListRow` with
  `leadingIcon="apps"` for all rows in this pass, and treat the avatar image as a progressive
  enhancement inside a small wrapper only when `avatar_url` is a string. **Chosen:** default to
  the `apps` symbol via `ListRow leadingIcon="apps"`; render the avatar `<Image>` only when
  `typeof item.avatar_url === 'string'` using a local `AppListRow` wrapper (defined at module
  scope, not during render, to avoid the nested-component lint rule) that composes an `<Image>`
  leading slot + title/subtitle + chevron, mirroring `ListRow`'s a11y (combined label,
  `accessibilityRole="button"`). Subtitle = `item.project_type` (R10 "platform/project type").
- **D7 — Pull-to-refresh.** Add `refreshing: boolean` state + `RefreshControl` on the
  `SectionList`. `onRefresh` resets to a clean first page: clear `dataModel`/`error` and call
  `getAPIData(null)` (which only fetches when there is no loaded data per its existing guard —
  so refresh must bypass that guard; implement a dedicated `refresh()` that fetches
  `apps.list(null)` and **replaces** `dataModel.data` instead of concatenating). Keep the
  concatenation path for `onEndReached` unchanged. `refreshing` is set false in both `.then`
  and `.catch`.
- **D8 — Keyboard handling (TokenForm).** Wrap the form content in `KeyboardAvoidingView`
  (`behavior={Platform.OS === 'ios' ? 'padding' : undefined}`) inside the `SafeAreaView` so the
  Sign In button stays visible when the keyboard is up. `SecureField` gets
  `returnKeyType="go"` + `onSubmitEditing={() => getAPIData(token)}` for a smooth flow.
- **D9 — Haptics/animations** come for free from `PrimaryButton`/`DestructiveButton` (light
  impact) and `SkeletonRow` (reduce-motion-gated). No extra animation is added in this pass.

---

## Ordered implementation plan

- [ ] 1. **Refactor `View/TokenForm.tsx` to the themed welcome layout.**
      Replace the whole presentation while preserving behavior. Keep the component name
      `LoginForm` and the `{ navigation }` prop shape. Preserve verbatim: the `getAPIData`
      callback's use of `ApiService` + `API_CONFIG.endpoints.apps.list(null)`, the
      `saveToken(apiToken)` + `navigation.navigate('Apps List', { appList: appModel })` success
      path, and the `useEffect` auto-login (`getToken()` → if non-null call `getAPIData`).
      Changes:
        - Add `const {colors, type, spacing} = useTheme();` and `const [error, setError] =
          useState<string|null>(null);` Keep `token`, drop `showToken` (SecureField owns it),
          keep/rename `getSpinner` → use it as the button `loading`.
        - Layout inside `SafeAreaView` → `KeyboardAvoidingView` (D8): centered column with
          `<AppIcon name="appGlyph" size={64} color={accent-as-string-guard} />`, a
          `type.largeTitle` title ("Welcome" / "Bitrise"), a `type.footnote` one-line PAT
          explanation, a `SectionCard` wrapping a `SecureField`
          (`value={token}` `onChangeText={t => {setToken(t); setError(null);}}`
          `placeholder="Personal access token"` `returnKeyType="go"`
          `onSubmitEditing={() => getAPIData(token)}`
          `toggleAccessibilityLabel`), inline `error` text under the field in
          `colors.statusFailed` when `error != null`, a `PrimaryButton title="Sign In"`
          `loading={getSpinner}` `onPress={() => getAPIData(token)}`, and a subtle
          link-style hint (a `Pressable`/`Text` in `type.footnote` + `colors.accent`) about
          where to create a token (text only; no navigation required).
        - Convert both former `Alert.alert` paths to `setError(...)`: the API `.catch` →
          `setError(getUserFacingError(error))`; the empty-token guard →
          `setError('Enter a Bitrise personal access token.')`; the keychain-save failure →
          `setError('Your token could not be stored securely. Please try again.')`. Remove the
          `Alert` import.
        - Remove the full-screen spinner overlay and all color-literal styles; rebuild
          `StyleSheet` entries from theme tokens (no literals).
      Files: `View/TokenForm.tsx`
      Verify: `npx jest __tests__/App.test.tsx` passes (App still renders), and
      `npx tsc --noEmit` (or the item 5 gate) reports no type errors in the file.

- [ ] 2. **Refactor `View/AppList.tsx` presentation + four states + search + pull-to-refresh.**
      Preserve verbatim: `getAPIData(next)` pagination (next-token concat), `convertToSection`
      grouping by `owner.name`, the `route.params.appList` seeding in `useEffect`, token read
      via `getToken()`, and the `onEndReached` using `dataModel?.paging.next != null ?
      dataModel.paging.next : null`.
      Changes:
        - Add `useTheme()`; add state `error: string|null`, `query: string`, `refreshing:
          boolean`, and a `hasLoaded: boolean` (set true in the first `.then`/`.catch`) to
          distinguish "not yet loaded" from "loaded but empty".
        - In `getAPIData` `.catch`: replace `Alert.alert` with `setError(getUserFacingError(error))`
          (and `setSpinner(false)`, `setRefreshing(false)`, `setHasLoaded(true)`).
        - Add a module-scope `AppListRow` component (D6) rendering a `ListRow`-style row:
          `leadingIcon="apps"` fallback or an `<Image source={{uri: item.avatar_url}}>` leading
          slot when `typeof item.avatar_url === 'string'`, title = `item.title`, subtitle =
          `item.project_type`, `onPress` → `navigation.navigate('BuildList', {slug: item.slug})`,
          combined `accessibilityLabel`, `accessibilityRole="button"`, 44pt min height.
        - Add a module-scope search-filter helper `filterSections(sections, query)` (D5) and
          compute `visibleSections = query ? filterSections(getSectionData, query) :
          getSectionData` for the `SectionList sections` prop. Keep `onEndReached` reading the
          unfiltered `dataModel.paging.next`.
        - Render an in-screen large title "Apps" (`type.largeTitle`) + a search `TextInput`
          (themed, `autoCorrect={false}`, `clearButtonMode="while-editing"`,
          `placeholder="Search apps"`, `value={query}` `onChangeText={setQuery}`,
          `accessibilityLabel="Search apps"`) as the `ListHeaderComponent` (so it scrolls with
          content and approximates collapse — D1).
        - Wire the **four states** (D4): initial-load → render N `SkeletonRow`s; error (no data)
          → `ErrorState message={error!} onRetry={() => {setError(null); getAPIData(null);}}`;
          empty (`hasLoaded && !error && visibleSections.length === 0`) → `EmptyState
          icon="apps"` with friendly copy (distinguish "no apps" from "no search matches" via a
          different message when `query` is non-empty); content → the `SectionList`.
        - Add `refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}`
          where `refresh()` (D7) clears `dataModel`/`error`, sets `refreshing`, fetches
          `apps.list(null)` and **replaces** (not concatenates) `data`, then re-groups.
        - Section headers and rows restyled from theme tokens (grouped look:
          `colors.groupedBackground` list background, `colors.secondaryGroupedBackground` rows,
          `type.footnote` uppercase-ish section headers in `colors.secondaryLabel`). Remove all
          color literals and the `Button`/`Alert`-for-errors usage.
        - Keep the existing bottom pagination spinner but restyle it with `colors.accent`
          (replace the `#0000ff` literal).
      Files: `View/AppList.tsx`
      Verify: `npx jest __tests__/App.test.tsx` passes; `npx tsc --noEmit` clean for the file.

- [ ] 3. **Replace Log Out header button with a destructive-confirmation flow (`AppList.tsx`).**
      In the `useEffect` `navigation.setOptions`, keep `headerLeft: () => null`, and keep the
      `headerRight` arrow (retain the existing
      `// eslint-disable-next-line react/no-unstable-nested-components` comment so no new lint
      warning appears). Change the button to a themed icon/text "Log Out" (accent color) whose
      `onPress` shows `Alert.alert('Log Out', 'Are you sure you want to log out?', [{text:
      'Cancel', style: 'cancel'}, {text: 'Log Out', style: 'destructive', onPress: () =>
      clearToken().then(() => navigation.goBack()).catch(() => setError(...))}])`. Preserve the
      exact `clearToken()` → `navigation.goBack()` behavior; on failure set an inline/toast-free
      sanitized error (reuse `setError` or keep the existing failure Alert — keep it minimal and
      do NOT expose raw errors). If an icon-only button is used it MUST have `accessibilityLabel`
      + `accessibilityHint` and a 44pt target.
      Files: `View/AppList.tsx`
      Verify: `npx jest __tests__/App.test.tsx` passes.

- [ ] 4. **Add render tests for both screens** under `__tests__/` (mirroring existing test
      conventions: `/** @format */`, `import 'react-native';`, `@jest/globals`, `renderer,
      {act}`, wrap `renderer.create` in `await act(async () => {...})`).
      Mock the data layer so no real network/keychain runs:
        - `jest.mock('../API Calls/TokenStorage', () => ({ getToken: jest.fn().mockResolvedValue(null), saveToken: jest.fn().mockResolvedValue(undefined), clearToken: jest.fn().mockResolvedValue(undefined) }))`.
        - `jest.mock('../API Calls/APIService', () => ({ __esModule: true, default: class { get = jest.fn().mockResolvedValue({ data: [], paging: { next: '' } }); } }))`.
      - `View/__tests__/TokenForm.test.tsx` (new folder `View/__tests__/`): (a) renders without
        throwing and shows the "Sign In" button label; (b) renders a `SecureField` (assert a
        `TextInput` with `secureTextEntry === true`); (c) with `getToken` mocked to return
        `null`, auto-login does not navigate (assert the `navigation.navigate` mock not called);
        optionally (d) pressing Sign In with empty token sets an inline error (assert the error
        text node appears). Pass a `navigation` stub `{ navigate: jest.fn() }`.
      - `View/__tests__/AppList.test.tsx`: (a) renders without throwing given a `navigation`
        stub `{ navigate: jest.fn(), setOptions: jest.fn(), goBack: jest.fn() }` and a `route`
        `{ params: { appList: { data: [], paging: { next: '' } } } }`; (b) with empty data +
        after load, the `EmptyState` renders (query its `testID`/title text); (c) with a couple
        of fake `Apps` in `route.params.appList`, rows render (assert the app titles appear).
      - If App.test.tsx render tree is affected, confirm it still passes (it imports the real
        screens); it should need no change since screens keep their exports and mounting
        contract. Only update it if a new required prop/route param is introduced (none is).
      Files: `View/__tests__/TokenForm.test.tsx`, `View/__tests__/AppList.test.tsx`
      (and `__tests__/App.test.tsx` only if actually impacted).
      Verify: `npx jest View/__tests__/TokenForm.test.tsx View/__tests__/AppList.test.tsx` —
      all new cases pass.

- [ ] 5. **Final gate (from repo root).**
      Files: none (verification only).
      Verify:
        - `npm run lint` — **0 errors**; warnings stay at the 5 pre-existing ones
          (`View/BuildLists.tsx` ×3, `View/RadioButton.tsx` ×2). The two screens and two new
          test files contribute **0 new** warnings (watch `react-native/no-inline-styles` and
          `react/no-unstable-nested-components` — keep the eslint-disable on `headerRight`,
          define `AppListRow`/helpers at module scope).
        - `npm test` — all suites green: prior **14 suites / 51 tests** still pass, **plus** the
          two new screen suites. Expected ≥ 16 suites.
        - Do NOT run a native build or `pod install` (JS/TS + Jest only).

---

## Behavior / security constraints preserved (checklist for the implementer)
- TokenForm: auto-login on mount via `getToken()` → validate → navigate; `saveToken()` on
  success; `ApiService` + `API_CONFIG` used exactly as today; only `getUserFacingError()`
  strings shown (now inline, no Alerts); masked token via `SecureField` (secure defaults
  enforced by the component).
- AppList: next-token pagination (`getAPIData` concat) unchanged; `convertToSection` grouping by
  `owner.name` unchanged; token read via `getToken()`; Log Out calls `clearToken()` then
  `navigation.goBack()`, now behind a destructive confirmation; only `getUserFacingError()` on
  failures; search + refresh are client-side/first-page only and never change the pagination
  fetch contract.
- No edits to `API Calls/*` or `View/APIConstants/APIConstants.tsx`; no route-name or file
  renames.

## Manual checklist (simulator-only — cannot be verified from this environment)
- **Native large-title collapse on scroll** is NOT achievable on the current JS
  `@react-navigation/stack` (no `headerLargeTitle`). This pass uses an in-screen large title +
  in-screen search that scroll with the list. True native collapse requires migrating the
  navigator to `@react-navigation/native-stack` (out of scope here; belongs with the BuildList
  task). Verify the in-screen large title + search feel on device; note the gap.
- Light/dark appearance switching live (PlatformColor on iOS) on both screens.
- Dynamic Type at the largest accessibility size: layouts must not clip; Sign In button and
  rows remain tappable (44pt).
- SF Symbols (`appGlyph`, `apps`, `show/hide`, `chevron`, `logout`) render on a real iOS build
  after `cd ios && pod install`.
- VoiceOver: SecureField toggle label, Sign In button, app rows (combined label), Log Out
  button (label + hint), search field label.
- RefreshControl pull-to-refresh and infinite-scroll pagination behavior on device.
- Keyboard-avoiding behavior on a small device (Sign In button stays visible with keyboard up).
