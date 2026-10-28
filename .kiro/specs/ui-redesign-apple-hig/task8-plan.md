# Task 8 Implementation Plan — BuildDetailView + AnsiText (R10)

UI-only redesign of `View/BuidDetailView.tsx` (keep the misspelled name — do NOT
rename) and `View/AnsiText.tsx`, following Apple HIG and reusing the existing
Theme + Components library. Work on branch `feature/ui-redesign-apple-hig` in the
user's repo (no worktree).

## Design decisions (grounded in the code I read)

- **Reuse, don't recreate.** `useTheme()` returns `{colors, type, spacing, scheme, reduceMotion, boldText}`; `type.mono` is the monospaced token; `colors.*` are the semantic tokens. Components in scope: `SectionCard`, `StatusBadge` (takes a `BuildState`, renders color+icon+label), `AppIcon` (decorative by default; pass `accessibilityLabel` to expose), `EmptyState`, `ErrorState` (renders only the sanitized message + Retry via `onRetry`), `SecondaryButton`/`PrimaryButton` (have a `loading` state per the button family). Time helpers `relativeTime`/`formatDuration` already exist in `View/BuildListViews/buildTime.ts` and are UI-only — reuse them for "started"/"duration".
- **Preserve data/behavior exactly.** Keep `getBuildDetails` (ApiService + `API_CONFIG.endpoints.builds.logs(appSlug, buildSlug)` with `getToken()`), keep `getLogs` (raw `fetch` of `expiring_raw_log_url`, split on `\n` into `LogChunks`), keep the `getUserFacingError()`-only error text, keep auto-scroll-to-end on content size change. No touching `API Calls/` or `APIConstants.tsx`.
- **Error display becomes a state, not an Alert.** Current code shows `Alert.alert('Error', getUserFacingError(error))`. Replace the *detail-fetch* error with the four-state pattern (`ErrorState` + retry). The *full-log* `fetch` failure keeps an inline/alert surface (still `getUserFacingError`-only) because it is a secondary action over already-rendered content — simplest correct choice that preserves "only user-facing error" behavior.
- **ANSI palette is a theme-driven map** (the one documented exception to the no-color-literals rule). anser 2.3.3 emits deterministic rgb strings for the 16 standard colors (verified: e.g. red=`187, 0, 0`, bright-black=`85, 85, 85`, white=`255,255,255`, bright-white=`255, 255, 255` — note inconsistent spacing). We intercept those exact strings and remap to tuned light/dark values so dim/bright-black text stays AA-readable on the themed log surface, and default fg (no `entry.fg`) follows `colors.label`.
- **`route.params.buildModel` is the summary data source.** `RootStackParamList` in `App.tsx` types it as `{slug: string}` (App.tsx is out of scope — do NOT change route names/types there). The runtime object navigated from `BuildItem` is a full `Build`. In the screen, treat `buildModel` as `Partial<Build>` via a local type (read `build_number`, `branch`, `triggered_workflow`, `status_text`, `triggered_at`/`started_on_worker_at`/`finished_at`) and render each field defensively (fall back to `—`/omit when absent). Do not widen the App.tsx route type.

## Build order

Each item leaves the codebase buildable. Baseline to preserve: `npm run lint` = 0
errors / 2 pre-existing RadioButton.tsx warnings; `npm test` = 18 suites / 74
passing. Lint = `eslint .`, tests = `jest`.

- [ ] 1. Create the theme-aware ANSI palette module `View/ansiPalette.ts`.
      Export `type AnsiColorKey` (16 keys: `black red green yellow blue magenta cyan white` + `bright-*`), a `normalizeRgb(fg: string): string` that strips spaces (so `"255, 255, 255"` and `"255,255,255"` collapse to one key), and `ANSER_RGB_TO_KEY: Record<string, AnsiColorKey>` built from anser's emitted triples (normalized): black `0,0,0`, red `187,0,0`, green `0,187,0`, yellow `187,187,0`, blue `0,0,187`, magenta `187,0,187`, cyan `0,187,187`, white `255,255,255`, bright-black `85,85,85`, bright-red `255,85,85`, bright-green `0,255,0`, bright-yellow `255,255,85`, bright-blue `85,85,255`, bright-magenta `255,85,255`, bright-cyan `85,255,255`, bright-white `255,255,255`. Export `getAnsiPalette(scheme: 'light' | 'dark'): Record<AnsiColorKey, string>` returning two hand-tuned AA-readable maps (dark map: bright-black/black lifted to a visible grey like `#8E8E93`, colors use the vivid dark variants; light map: white/bright-white darkened to a readable grey so they are not invisible on a light log surface, colors use darker variants). Add a `resolveAnsiFg(fg: string | null, scheme, labelColor): string` helper: `null`/unmapped → `labelColor`; mapped → palette value. Keep bg handling pass-through (apply only when `entry.bg` present). This module is the single source for ANSI literals.
      Files: `View/ansiPalette.ts`
      Verify: `npx jest View/__tests__/ansiPalette` (written in step 6) passes; `npx tsc --noEmit` clean.

- [ ] 2. Make `View/AnsiText.tsx` theme-aware using the palette map.
      Add `useTheme()` inside `AnsiText`; derive `scheme` and `colors.label`. Replace `styleForEntry`'s raw ``color: `rgb(${entry.fg})` `` with `resolveAnsiFg(entry.fg, scheme, labelColorString)` and keep bg as a themed/pass-through value. Default foreground (when `entry.fg` is null) must resolve to the theme label color. Preserve `anser.ansiToJson(..., {remove_empty:true})` and the bold/dim(opacity 0.5)/underline/italic decoration mapping exactly. Keep the `{ansi, containerStyle, textStyle}` props and the nested `<Text>` structure. `labelColor` from PlatformColor is an `OpaqueColorValue`; pass it through only when it is a string, else let the Text inherit (guard with `typeof === 'string'`), matching the pattern used across Components.
      Files: `View/AnsiText.tsx`
      Verify: `npx jest View/__tests__/AnsiText` (step 6) passes in both schemes; existing suites unaffected.

- [ ] 3. Add the log-view UI helpers to `View/BuidDetailView.tsx` state.
      Introduce local UI state only: `const [atBottom, setAtBottom] = useState(true)` for jump-to-bottom tracking and `const [fullLogLoading, setFullLogLoading] = useState(false)` for the Load Full Log progress (separate from the detail `loader` so the header/button can show its own spinner). Add an `onScroll` handler computing distance from bottom (`contentSize.height - (layoutMeasurement.height + contentOffset.y) < threshold`, threshold ~24pt) → `setAtBottom(...)`; set `scrollEventThrottle={16}`. Keep the existing `scrollViewRef` + `onContentSizeChange` auto-scroll-to-end. Do NOT change `getBuildDetails`/`getLogs` fetch bodies; only wrap `getLogs` with the `fullLogLoading` flag around its existing `setLoader` usage (keep `setLoader` too, or swap the full-log path to `fullLogLoading` — keep detail `loader` for the initial fetch).
      Files: `View/BuidDetailView.tsx`
      Verify: `npx tsc --noEmit` clean; screen still mounts (covered by step 7 test).

- [ ] 4. Add the error/empty/loading state wiring to `View/BuidDetailView.tsx`.
      Track a detail-fetch error: `const [errorMsg, setErrorMsg] = useState<string | null>(null)`; in `getBuildDetails`'s `.catch`, set `setErrorMsg(getUserFacingError(error))` instead of `Alert.alert` (keep `getUserFacingError`-only). Render precedence inside the themed container: (a) `loader` → centered `ActivityIndicator` using `colors.accent` (replace the hardcoded `#0000ff`); (b) `errorMsg` → `ErrorState message={errorMsg} onRetry={() => { setErrorMsg(null); getBuildDetails(appSlug, buildSlug); }}`; (c) no error and `log_chunks` empty → `EmptyState icon="logs" title="No logs yet" message="This build hasn't produced any log output."` with `testID="build-detail-empty-state"`; (d) otherwise the log content. Keep the full-log `getLogs` catch showing a user-facing message (inline text or retained Alert — `getUserFacingError` only).
      Files: `View/BuidDetailView.tsx`
      Verify: `npx jest View/__tests__/BuildDetailView` (step 7) exercises empty + error + content; lint clean.

- [ ] 5. Build the redesigned render tree in `View/BuidDetailView.tsx` (summary card + themed log + jump-to-bottom + Load Full Log).
      Replace the `StyleSheet.create` color literals (`black`/`white`/`#0000ff`) with theme-derived inline styles via `useTheme()`.
      - **Summary card:** a `SectionCard title="BUILD"` at the top containing, as rows: `StatusBadge state={buildModel.status_text}` (guard when undefined); build number rendered mono (`fontFamily: type.mono`, `#{build_number}`); branch mono with an `AppIcon name="branch"`; workflow with `AppIcon name="workflow"` + `triggered_workflow`; "Started" = `relativeTime(buildModel.triggered_at)`; "Duration" = `formatDuration(buildModel.started_on_worker_at, buildModel.finished_at)`. Field label text uses `type.footnote`/`colors.secondaryLabel`; values `type.subheadline`/`colors.label`. Each field `accessible` with a readable label. Use mono ONLY for build number + branch per R5.
      - **Log container:** a `View` with `backgroundColor: colors.secondaryBackground` (themed surface, not raw black), `borderRadius: spacing.radius.md`, `padding: spacing.spacing.sm`, wrapping the existing `ScrollView`. Keep mapping `log_chunks` → `AnsiText`; set `containerStyle`/`textStyle` to `{fontFamily: type.mono, fontSize: type.footnote.fontSize}` and make the text selectable: pass `selectable` down (add a `selectable?: boolean` prop to `AnsiText`'s outer `<Text>`, default true for logs) OR wrap with `selectable` on the outer Text in AnsiText (step 2 — prefer adding `selectable` to AnsiText's outer `<Text>` so copy works).
      - **Jump-to-bottom button:** a floating `Pressable` (absolute, bottom-right, `minWidth/minHeight: spacing.minTouchTarget`, circular, `backgroundColor: colors.accent`) containing `AppIcon name="chevron"` (rotate 90° via style to point down) or reuse an existing down affordance; rendered only when `!atBottom`. `onPress` → `scrollViewRef.current?.scrollToEnd({animated: !reduceMotion})`. `accessibilityLabel="Jump to bottom"`, `accessibilityHint="Scrolls to the latest log output"`, `accessibilityRole="button"`. Gate any entrance animation (e.g. Reanimated `FadeIn`/opacity) on `reduceMotion` from `useTheme()` — when `reduceMotion`, render statically with no animation.
      - **Load Full Log control:** keep it as the `navigation.setOptions` `headerRight` button (preserves current UX) but drive its state from `fullLogLoading`: while loading render an `ActivityIndicator` (or disabled button) instead of the tappable control; give the control `accessibilityLabel="Load full log"` + `accessibilityHint="Fetches the complete build log"`. Keep calling the unchanged `getLogs(getBuildData.expiring_raw_log_url.toString())`; keep the "not available yet" guard. The effect still re-runs on `getBuildData`/`fullLogLoading` change (keep the existing exhaustive-deps eslint-disable comment).
      Files: `View/BuidDetailView.tsx`
      Verify: `npm run lint` → 0 errors / only the 2 pre-existing RadioButton warnings; `npx tsc --noEmit` clean.

- [ ] 6. Update/add the AnsiText test for theme-aware palette mapping in both schemes.
      Create `View/__tests__/AnsiText.test.tsx` and `View/__tests__/ansiPalette.test.ts` using `react-test-renderer` + `@jest/globals` (mirror `useTheme.test.tsx`). Mock `react-native`'s `useColorScheme` per test to force `'light'` then `'dark'` (e.g. `jest.spyOn` or `jest.mock('react-native', ...)` returning the scheme) so `useTheme().scheme` flips. Assertions:
      - `ansiPalette.test.ts`: `normalizeRgb('255, 255, 255') === normalizeRgb('255,255,255')`; `ANSER_RGB_TO_KEY[normalizeRgb('85, 85, 85')] === 'bright-black'`; `getAnsiPalette('light')['bright-black']` differs from `getAnsiPalette('dark')['bright-black']`; every one of the 16 keys defined in both schemes.
      - `AnsiText.test.tsx`: render `<AnsiText ansi={"\u001b[90mX\u001b[0m"} />` (bright-black) and read the inner `<Text>` `style.color`; assert it equals the light-scheme palette value, then re-render under dark and assert it equals the dark value (they must differ). Render a plain-text entry (no `entry.fg`) and assert its color resolves to the theme `label` color (string form on Android palette: `#000000` light / `#FFFFFF` dark — force Android via `Platform.OS` mock or assert against `getColors(scheme).label`). Assert bold decoration still yields `fontWeight: 'bold'` and dim yields `opacity: 0.5`.
      Files: `View/__tests__/AnsiText.test.tsx`, `View/__tests__/ansiPalette.test.ts`
      Verify: `npx jest View/__tests__/AnsiText View/__tests__/ansiPalette` — all new tests pass.

- [ ] 7. Add a render test for `BuildDetailView` with mocked token/ApiService/fetch.
      Create `View/__tests__/BuildDetailView.test.tsx` mirroring `BuildLists.test.tsx`:
      - `jest.mock('../../API Calls/TokenStorage', () => ({getToken: jest.fn().mockResolvedValue('tok'), ...}))`.
      - `jest.mock('../../API Calls/APIService', ...)` with a class whose `get` resolves a controllable `mockGetResponse.current` (a `BuildDetailModel`-shaped object: `{log_chunks: [...], expiring_raw_log_url: 'https://x/log'}`).
      - Stub `global.fetch = jest.fn().mockResolvedValue({ok: true, text: () => Promise.resolve('line1\nline2')})` for the full-log path; restore in `afterEach`.
      - `navigation = {setOptions: jest.fn()}`, `route = {params: {appSlug: 'app', buildModel: makeBuild({...})}}` (reuse a `makeBuild` like BuildLists so summary fields exist).
      - Use `jest.useFakeTimers()` + `await act(async () => ...)` to flush the promise chain, as the BuildLists test does.
      Cases: (a) non-empty `log_chunks` → renders `AnsiText` content + summary fields (`main`, workflow, `#142`, status label `Success`); (b) empty `log_chunks` → `testID="build-detail-empty-state"` present; (c) `get` rejects → `ErrorState` message shown (assert the Retry button / sanitized text, and that no raw error leaks); (d) `setOptions` called (header Full Log wiring). Assert no real network: `fetch` only called when the full-log action fires, keychain mocked.
      Files: `View/__tests__/BuildDetailView.test.tsx`
      Verify: `npx jest View/__tests__/BuildDetailView` — all cases pass; no network/keychain touched.

- [ ] 8. Full gate.
      Run the whole suite and linter; keep the baseline green (now 19 suites: +AnsiText/ansiPalette/BuildDetailView, existing 74 tests still pass).
      Files: none (verification only)
      Verify: `npm run lint` → 0 errors / 2 pre-existing RadioButton.tsx warnings; `npm test` → all suites pass (prior 74 + new).

## Notes / assumptions

- `AnsiText` gains two optional props (`selectable?`, and it internally reads the
  theme); its public `{ansi, containerStyle, textStyle}` contract is preserved, so
  the existing call site keeps working.
- The full-log fetch error path intentionally stays a lightweight inline/alert
  surface (still `getUserFacingError`-only) rather than swapping the whole screen
  to `ErrorState`, because the content is already rendered; the four-state
  `ErrorState` is reserved for the initial detail fetch per R9.
- App.tsx route type still declares `buildModel: {slug: string}`; out of scope to
  change. The screen reads extra `Build` fields defensively via a local
  `Partial<Build>` cast, so missing fields render as `—`/omitted rather than
  crash.
- Jump-to-bottom entrance animation uses Reanimated (already a dependency, mocked
  in jest.setup.js) and is gated on `reduceMotion`.
