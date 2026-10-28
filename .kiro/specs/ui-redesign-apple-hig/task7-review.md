# Review — Task 6.5 (native-stack migration) + Task 7 (BuildList redesign)

Branch: `feature/ui-redesign-apple-hig`
Commit under review: `0242554` — "feat: migrate to native-stack and redesign BuildList (tasks 6.5 + 7)"
Verdict: **APPROVED** (no blocking findings)

## Scope reviewed
Diff files: `App.tsx`, `View/AppList.tsx`, `View/BuildLists.tsx`,
`View/BuildListViews/{BuildItem,BuildHeader,BuildBranch}.tsx`,
`View/BuildListViews/buildTime.ts`, `View/Components/StatusBadge.tsx`,
`jest.setup.js`, `package.json`, `package-lock.json`, and the two new test files
(`View/__tests__/BuildLists.test.tsx`, `View/BuildListViews/__tests__/buildTime.test.ts`).
Checked against task7-plan.md, requirements.md R10 (+R1/R7/R8/R9/R12), design.md intent,
and tasks.md 6.5/7.

## Evidence used
- Recorded in commit message: `npm run lint` = 0 errors, 2 warnings (both pre-existing
  in `RadioButton.tsx`; the 3 prior `BuildLists.tsx` warnings gone, no new warnings);
  `npm test` = 18 suites / 74 tests passing (was 16 / 59). The +2 suites match the two
  new test files; the +15 tests are consistent.
- Narrow spot-check (one specific doubt — whether native-stack's `react-native-screens`
  dependency breaks the unchanged App render test): ran `npx jest __tests__/App.test.tsx`
  → 1 passed. Doubt resolved; full suites not rerun.

## Task 6.5 — Navigation migration
- Route names EXACT and unchanged: `LoginForm`, `Apps List`, `BuildList`,
  `BuildDetailView`. `RootStackParamList` keys/types unchanged; `initialParams` preserved
  on `BuildList` (`{slug: ''}`) and `BuildDetailView` (`{appSlug: '', buildModel: {slug: ''}}`).
- `App.tsx` now imports `createNativeStackNavigator` from `@react-navigation/native-stack`
  (not `@react-navigation/stack`). `headerLargeTitle: true` set on `Apps List` and
  `BuildList`. Header styling intent preserved via `screenOptions`
  (`headerTintColor: 'white'`, `headerStyle.backgroundColor: 'tomato'`,
  `headerLargeTitleStyle.color: 'white'`). `Apps List` `title: 'Apps'`.
- LoginForm header: default shown preserved (no `headerShown:false` added), matching the
  prior stack behavior — the plan clarified it "was not hidden".
- `package.json`: `@react-navigation/native-stack@7.21.0` added (pinned, same style);
  stale `@react-navigation/stack` removed. No `@react-navigation/stack` references remain
  in `App.tsx` or `View/` (grep clean). Nav type imports switched to
  `NativeStackNavigationProp` in AppList, BuildLists, BuildItem.
- `View/AppList.tsx`: in-screen large-title `<Text>Apps</Text>` and `largeTitleStyle`
  removed; search `TextInput`, four states, pagination (`dataModel?.paging.next` guard),
  footer spinner, and destructive Log Out header-right all intact (only the heading block
  was deleted in the diff).

## Task 7 — BuildList redesign (R10)
- Card/inset rows: `BuildHeader` renders `StatusBadge` (color + SF symbol + text label —
  never color alone, satisfies R8/R12) plus the build number mono (`type.mono`,
  `#{build_number}`). `BuildBranch` renders the `branch` symbol + branch name in mono.
  `BuildItem` adds the `workflow` symbol + `triggered_workflow`, and a meta line with
  `relativeTime(triggered_at)` and, for finished builds, `formatDuration(...)`.
- Running builds animate: `StatusBadge` applies the `rotate` effect for `InProgress`,
  gated on `reduceMotion` inside `AppIcon` (confirmed `effect && !reduceMotion`).
- Header-right Trigger button: module-scope `TriggerButton` with `AppIcon name="trigger"`
  (= `play.fill`), `accessibilityRole/Label/Hint`, 44pt target + hitSlop, `onPress` →
  `setModalVisible(true)`. Wired via `navigation.setOptions({headerRight})`.
- Trigger modal: `BuildTriggerModal` wired exactly as before (`visible`, `slug`, `cancel`,
  `isAbortVisible`, `abortBuild`). Modal source untouched (not in diff).
- Abort via BOTH paths: right-swipe via `ReanimatedSwipeable` `renderRightActions`
  (shown only when `finished_at === null`) and long-press (`onLongPress` only for running
  builds). Both call `onAbort(slug)` → `openAbortSheet` → sets slug + `setAbortVisible(true)`,
  which is byte-identical to the previous row's abort entry. Both funnel into the existing
  reason-capture modal branch and its destructive "Abort Build" button.
- Exact abort call preserved: `abortBuild(buildSlug, reason)` POSTs
  `{abort_reason, abort_with_success: true, skip_notifications: true}` to
  `API_CONFIG.endpoints.builds.abort(route.params.slug, buildSlug)` — unchanged vs `955d50c`.
- Pagination: `getAppBuilds` keeps the guard
  `if (next === null && (getBuilds?.data ?? []).length > 0) return;`, the concat logic, and
  the `onEndReached` guard `if ((getBuilds?.data ?? []).length > 0) getAppBuilds(..., next ?? null)`
  — all unchanged. `onEndReachedThreshold={0.1}`. Footer `ActivityIndicator` shown while
  `getSpinner && builds.length > 0` (accent color string-guarded).
- Pull-to-refresh: `RefreshControl` → `refresh()` fetches page one and REPLACES data;
  bypasses the "already loaded" guard without altering the next-token contract.
- Four states: initial `SkeletonRow`s; content FlatList; `EmptyState` (icon `build`,
  testID `builds-empty-state`); `ErrorState` with `getUserFacingError` message + Retry
  (testID `builds-error-state`). On failure only `getUserFacingError()` strings are shown
  (fetch catch and abort catch both route through it); abort success/failure keeps an
  `Alert` acknowledgement, which the plan explicitly permitted.
- Accessibility: row is one combined element — `accessible` + `accessibilityRole="button"`
  + composed label `Build {n}, {statusLabel}, branch {branch}, {relativeTime}` (matches R12
  example) + hint "Opens build details". Icon-only Trigger and Abort controls carry label +
  hint and 44pt targets. `statusLabel()` exported from StatusBadge so the spoken status
  matches the badge.
- Theme tokens only: no color literals in any changed View file (grep clean). Colors come
  from `colors.*`; `PlatformColor` tokens string-guarded (`typeof x === 'string' ? x : undefined`)
  before being passed to `AppIcon`/`ActivityIndicator`, as required.
- Subcomponents: `BuildHeader.tsx` and `BuildBranch.tsx` rewritten as thin themed
  presentational pieces (no literals, mono where required), kept (not renamed/deleted),
  and imported by `BuildItem` — matching the plan's chosen approach.
- `buildTime.ts`: pure TS, no RN/native imports, no `API Calls/` touch. `relativeTime`
  (just now / min / hr / days, `'—'` fallback, injectable `nowMs`) and `formatDuration`
  (`''` for missing/invalid/negative, running builds return `''`).

## Hard constraints
- No files under `API Calls/` or `View/APIConstants/APIConstants.tsx` modified (diff stat
  confirms; the only "API Calls" string in the commit is the message body).
- No renames: `git show --name-status` shows only `M`/`A`, no `R`.
- Trigger payload, abort payload, and pagination guard behavior all preserved verbatim.

## Tests
- `App.test.tsx`: unchanged; spot-check confirms it still mounts under native-stack (passes).
- `View/__tests__/BuildLists.test.tsx`: mocks `getToken` + `ApiService` (no network/keychain),
  `ReanimatedSwipeable` globally mocked in `jest.setup.js`. Covers empty state, success
  row (number/branch/workflow/Success), `setOptions` header wiring, and an in-progress
  build ("In Progress") rendering with abort wiring present.
- `View/BuildListViews/__tests__/buildTime.test.ts`: covers relativeTime (just now, min,
  hr, days, singular day, invalid/empty) and formatDuration (sec, min+sec, hr+min, null
  finished_at, invalid).
- Recorded lint/test gates met; new helper + render suites added.

## Findings
None blocking.
