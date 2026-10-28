# LoginForm and Apps List redesign (tasks 5-6, Apple HIG)

The commit `955d50c` refactors exactly the two screens in scope — `View/TokenForm.tsx` (LoginForm) and `View/AppList.tsx` (Apps List) — onto the theme and shared components built in tasks 1-4, and adds render tests for both under `View/__tests__/`. The change is pure presentation: the data-layer calls, pagination, grouping, auto-login, save/clear-token, and error-string handling are preserved verbatim, with Alerts replaced by inline/full-screen themed states. The Apps List gains the four network-screen states, client-side search, pull-to-refresh, and a destructive Log Out confirmation. The diff touches only the four intended files; no forbidden file, route name, or file name was changed.

Watch for: the native collapsing large title from R10 is deliberately not implemented — the JS `@react-navigation/stack` has no `headerLargeTitle`, so an in-screen large title that scrolls with the list is used instead (confirmed; documented as a deferred trade-off in the plan's D1 and manual checklist). Everything else requested is present.

**Verdict**: APPROVED

## High-level view

Behavior and security are preserved exactly. TokenForm keeps the `getToken()` → validate → `navigate` auto-login on mount, `saveToken()` on success, and the same `ApiService` + `API_CONFIG` call; AppList keeps the next-token concatenation pagination with its exact `paging.next != null` guard, `convertToSection` grouping by `owner.name`, the `getToken()` read, and `clearToken()` → `goBack()` on Log Out. Both screens surface only `getUserFacingError()` output on API failure, and the token field is masked through `SecureField`, which hard-sets the secure input props so callers cannot weaken them.

The error UX moved from Alerts to inline/in-screen states per R10: TokenForm renders an inline error under the field in the `statusFailed` token, AppList routes fetch failures to a full-screen `ErrorState` + Retry, and only the Log Out confirmation remains an Alert (by design — it is a confirmation, not an error). Non-API failures (keychain save/clear) show fixed sanitized sentences rather than raw error text.

The four states on Apps List are derived from existing state without altering the fetch contract: skeleton rows on initial load, the `SectionList` for content, a distinct empty state (no-apps vs no-search-match copy), and an error state with Retry. Search filters the already-grouped sections client-side and leaves `onEndReached` reading the unfiltered `dataModel.paging.next`. Pull-to-refresh uses a dedicated first-page `refresh()` that replaces rather than concatenates, keeping the pagination path untouched.

Reuse and theming are clean: both screens consume `useTheme()` tokens and the shared `AppIcon`/`SecureField`/`SectionCard`/`PrimaryButton`/`EmptyState`/`ErrorState`/`SkeletonRow` components, with no re-created components and no color literals. Accessibility covers combined row labels, button roles, 44pt targets, and label+hint on the icon-only Log Out button.

The one requirement not met is the native large-title collapse, deliberately deferred because it would require swapping the navigator to native-stack — outside this two-file, no-dependency scope. It is documented in the plan and surfaced for device verification. This is a respected trade-off, not a blocking gap.

<details>
<summary>Issues (1)</summary>

1. **Large-title collapse deferred (non-blocking)** — R10's native collapsing "Apps" title is not implemented; an in-screen large title that scrolls with the list is used because the JS `@react-navigation/stack` lacks `headerLargeTitle`. Accepted per plan D1; revisit when the navigator migrates to native-stack (BuildList task). No action required for this pass.

</details>

<details>
<summary>Details</summary>

### Behavior preserved verbatim across both screens

Diffing `955d50c` against its parent confirms the data paths are unchanged. TokenForm's `getAPIData` still builds `new ApiService(API_CONFIG.BASE_URL + API_CONFIG.API_VERSION)`, calls `API_CONFIG.endpoints.apps.list(null)` with the same `content-type`/`Authorization` headers, and on success does `saveToken(apiToken)` then `navigation.navigate('Apps List', {appList: appModel})`. The mount `useEffect` keeps the `isMounted` guard, `getToken()`, and the `savedToken != null` auto-login call. AppList's `getAPIData` keeps the three-branch load guard, the `appsData.concat(newPageApps)` accumulation, and `onEndReached` still reads `dataModel?.paging.next != null ? dataModel.paging.next : null`. `convertToSection` is byte-for-byte the same sort-by-`owner.name` grouping, including the trailing-section append. Log Out still calls `clearToken().then(() => navigation.goBack())`.

The only behavioral deltas are the ones R10 asks for: Alerts became inline/full-screen themed states, and the former empty-token `Alert` became `setError('Enter a Bitrise personal access token.')`.

### Security posture — masking and error sanitization intact

The token field renders through `SecureField`, which omits the five security-critical props from its public prop type and hard-sets `secureTextEntry`, `autoComplete="off"`, `autoCorrect={false}`, `spellCheck={false}`, `importantForAutofill="no"`, `textContentType="none"`, and `autoCapitalize="none"` internally — callers cannot override them. The show/hide toggle is preserved. The test asserts a `TextInput` with `secureTextEntry === true` is present.

Only `getUserFacingError()` output reaches the UI on API failure: TokenForm's `.catch` sets `setError(getUserFacingError(fetchError))` and AppList's two `.catch` blocks do the same, feeding `ErrorState`, which documents and renders the passed string verbatim with no inspection or formatting. The non-API failure paths (keychain save in TokenForm, keychain clear in AppList) set fixed sanitized sentences and log the raw error only under `__DEV__`, so no stack trace or server body is surfaced. This matches R2 exactly.

### Four states on Apps List without touching the fetch contract

The states are derived at render time from existing state plus a new `hasLoaded` flag, so the next-token fetch is unchanged. `isInitialLoading` gates on `getSpinner && (dataModel?.data ?? []).length === 0 && !refreshing` and renders `SKELETON_COUNT` (6) `SkeletonRow`s. `hasFetchError` (`error != null` with no loaded data) renders `ErrorState` whose Retry clears the error and calls `getAPIData(null)`. `isEmpty` (`hasLoaded && !hasFetchError && !isInitialLoading && visibleAppCount === 0`) renders `EmptyState` with copy that distinguishes "No matches" (active query) from "No apps yet". Otherwise the `SectionList` renders, with the bottom pagination spinner retained as `ListFooterComponent` and themed to `colors.accent`.

A good detail: because `convertToSection` always appends a trailing section (even when empty), emptiness is computed from `visibleAppCount` (a reduce over `section.data.length`) rather than `sections.length`, which would otherwise never be zero. That avoids a false "non-empty" state.

### Search and pull-to-refresh leave pagination alone

`filterSections` is a module-scope pure helper that filters the already-grouped sections by `title` or `owner.name` (case-insensitive, trimmed) and drops emptied sections. `visibleSections` is memoized and only applied to the `SectionList sections` prop; `onEndReached` still reads the unfiltered `dataModel.paging.next`, so searching never changes what the next page fetch requests (R10). `refresh()` is a dedicated first-page fetcher that sets `refreshing`, fetches `apps.list(null)`, and **replaces** `dataModel` rather than concatenating — intentionally bypassing the `getAPIData` "already loaded" guard without disturbing the concat path used by scroll pagination.

### Reuse, theming, and the AppListRow

A grep for hex/`rgba`/named color literals in both files returns nothing — all surfaces, text, and separators read from theme tokens, and the raw-string guard (`typeof token === 'string' ? token : undefined`) is used wherever a tint/hex string is required for `AppIcon`. The former `#0000ff` footer spinner and the `#0000ff` overlay are gone.

`AppListRow` is defined at module scope (avoiding the unstable-nested-component lint rule), renders the `apps` symbol fallback or an `<Image>` when `avatar_url` is a non-empty string, uses `project_type` as subtitle, and mirrors `ListRow`'s accessibility. The `headerRight` Log Out arrow keeps the existing `eslint-disable-next-line react/no-unstable-nested-components` comment, so no new warning is introduced.

### Accessibility

App rows read as a single element: `accessible`, `accessibilityRole="button"`, a combined `accessibilityLabel` (`title, project_type`), and an `accessibilityHint`, with `minHeight: spacing.minTouchTarget` (44). The icon-only Log Out button has `accessibilityLabel` + `accessibilityHint`, a 44×44 `headerButton` style, and `hitSlop`. The search field has `accessibilityLabel="Search apps"`. TokenForm's Sign In is a `PrimaryButton` (button role + 44pt enforced by `BaseButton`), the token hint is a `Pressable` with `accessibilityRole="link"` + hint, and the `SecureField` toggle carries a label. This satisfies R12 for these screens.

### Scope discipline — no forbidden edits

The commit's file list is exactly `View/TokenForm.tsx`, `View/AppList.tsx`, and the two new test files. Nothing under `API Calls/`, no `View/APIConstants/APIConstants.tsx`, and none of BuildList/BuildDetailView/BuildTriggerModal/AnsiText/BuildListViews were touched. No file renames, no route-name changes (`'Apps List'` and `'BuildList'` are used as before).

### Deferred: native large-title collapse

R10 asks for a collapsing large title on Apps List. The implementation uses an in-screen `type.largeTitle` "Apps" plus the search field as the `ListHeaderComponent`, so they scroll with the list rather than collapsing in a native header. The plan (D1 and the manual checklist) documents that the installed JS `@react-navigation/stack` has no `headerLargeTitle` — that is a native-stack feature — and that adding the dependency or changing `App.tsx`'s navigator is outside this UI-only, two-file scope. This is a deliberate, documented trade-off rather than an oversight; it is called out here for on-device verification and belongs with the future native-stack migration.

### Tests

Two new suites were added with the data layer mocked (`TokenStorage` and `APIService`), so no network or keychain runs. TokenForm covers render, the masked secure field, no auto-navigate when `getToken()` resolves null, and the empty-token inline error. AppList covers render with an empty list, the empty state after load, row rendering for seeded apps, and that `setOptions` wires the Log Out header button; it flushes VirtualizedList timers in `afterEach` to avoid post-test state updates.

Not tested (acceptable for a render-level pass, but worth noting): the success path that calls `saveToken` + `navigate`, the `getUserFacingError` error branch on either screen, search filtering, pull-to-refresh replacement, and the destructive Log Out confirmation flow. These are behavioral paths that would strengthen regression coverage later; none is required by the plan's test items.

### Verification evidence

The commit message records `npm run lint` at 0 errors / 5 pre-existing warnings (BuildLists ×3, RadioButton ×2) with 0 new warnings, and `npm test` at 16 suites / 59 tests (baseline 14/51 plus 2 new suites / 8 tests). As a narrow spot-check I ran only the two new suites (`View/__tests__/TokenForm.test.tsx` and `View/__tests__/AppList.test.tsx`): 2 suites / 8 tests pass, matching the recorded evidence. The full suite and lint were not re-run per the judge-don't-verify instruction.

</details>

<details>
<summary>File map</summary>

- `View/TokenForm.tsx` — LoginForm refactored to themed welcome layout: `AppIcon` glyph, largeTitle, PAT footnote, `SectionCard` + `SecureField`, `PrimaryButton` with in-button loading, inline error, link-style hint, `KeyboardAvoidingView`. Auto-login/save/navigate preserved.
- `View/AppList.tsx` — Apps List refactored to inset-grouped `SectionList` with in-screen large title + search header, module-scope `AppListRow`, four states, pull-to-refresh, themed footer spinner, and destructive Log Out confirmation. Pagination/grouping/token behavior preserved.
- `View/__tests__/TokenForm.test.tsx` — new render tests (mocked data layer): Sign In button, masked field, no auto-navigate without token, empty-token inline error.
- `View/__tests__/AppList.test.tsx` — new render tests (mocked data layer): empty render, empty state, row rendering, Log Out header wiring.

Full diff: `git diff e172b37 955d50c`

</details>
