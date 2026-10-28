# BuildDetailView summary card + theme-aware ANSI log rendering (task 8, R10)

UI-only redesign of `View/BuidDetailView.tsx` and `View/AnsiText.tsx` plus a new `View/ansiPalette.ts`. The screen gains a `SectionCard` summary (status, build number, branch, workflow, started, duration), a themed monospaced log surface, a four-state loading/error/empty/content pattern, a jump-to-bottom floating button, and a header "Load Full Log" control with its own loading spinner. AnsiText now resolves ANSI foreground colors through a single theme-driven palette that stays WCAG-AA readable in light and dark. The two data paths (`getBuildDetails` via ApiService, `getLogs` via raw `fetch`) are preserved verbatim; only the detail-fetch error surface changed from an `Alert` to an `ErrorState`.

Watch for: the jump-to-bottom button has no entrance animation at all — the plan asked for an animation *gated on* reduceMotion, and the implementation renders it statically in every case (confirmed). This is compliant with the accessibility intent but drops the animated affordance; worth a conscious accept. Everything else — exact fetch preservation, the palette's single-source color table, scope, and route/name invariants — holds.

**Verdict**: APPROVED

## High-level view

The two fetch functions are byte-for-byte unchanged except for the two edits the plan called for: the full-log path flips `fullLogLoading` instead of the shared `loader`, and the detail `.catch` now calls `setErrorMsg(getUserFacingError(error))` instead of `Alert.alert`. The full-log `.catch` keeps the `getUserFacingError`-only Alert, matching the "secondary action over already-rendered content" decision. Auto-scroll-to-end on content size change is untouched.

The ANSI palette lives in one module. `anser`'s deterministic rgb triples are normalized (whitespace stripped) and remapped to hand-tuned light/dark values; near-black and near-white entries are lifted/darkened so dim and bright-black text never vanish on the themed surface, and any unrecognized or absent foreground falls back to the theme label color. No raw ANSI color literals exist outside this module.

The summary card renders each field defensively — status is gated behind a `BuildState` membership check, and every optional field is omitted (not rendered as a crash) when absent. Build number and branch use the mono token; nothing else does, matching R5. The log container uses `secondaryBackground` as its surface rather than the old hardcoded black.

Scope is clean: exactly the three task-8 files plus two test files changed in this commit. No other screen, nothing under `API Calls/`, and `APIConstants.tsx` untouched. `BuidDetailView.tsx` keeps its misspelled name and the route type in `App.tsx` was not widened.

<details>
<summary>Issues (2)</summary>

1. **Jump-to-bottom entrance animation dropped** — the plan specified an entrance animation gated on reduceMotion; the button renders statically with no animation in any case. Accessibility intent is satisfied but the animated affordance is gone. Accept or add a reduceMotion-gated fade. (non-blocking)
2. **`bright-white` absent from the rgb→key map** — anser emits `255,255,255` for both `white` and `bright-white`, so the single triple maps to `white` only; a `bright-white` entry can never be hit at runtime. Documented and intentional, but the palette's `bright-white` value and the test's `ALL_KEYS` coverage of it are dead relative to live rendering. (informational)

</details>

<details>
<summary>Details</summary>

### Fetch preservation

Diffing the committed `getLogs`/`getBuildDetails` against the base (`56012e9`) confirms the request bodies are identical: `getLogs` still issues `fetch(_url, {method:'GET'})`, throws on `!response.ok`, splits `result` on `\n` into `LogChunks`, and merges into `setBuildData` with the same `expiring_raw_log_url` fallback. `getBuildDetails` still awaits `getToken()`, early-returns on null, builds `ApiService(BASE_URL + API_VERSION)`, calls `API_CONFIG.endpoints.builds.logs(appSlug, buildSlug)` with the `content-type`/`Authorization` headers, and the same `JSON.parse(JSON.stringify(data))` round-trip. The only deltas are the two the plan prescribed — the full-log path toggles the new `fullLogLoading` state, and the detail `.catch` sets `errorMsg` via `getUserFacingError` instead of raising an Alert. The full-log `.catch` keeps the `getUserFacingError`-only Alert. `onContentSizeChange` → `scrollToEnd({animated:false})` is carried over unchanged.

### Theme-aware ANSI palette

`styleForEntry` no longer emits `` color: `rgb(${entry.fg})` ``; it routes every foreground through `resolveEntryColor(entry.fg, scheme, colors.label)`, which normalizes the triple, looks it up in `ANSER_RGB_TO_KEY`, and returns the scheme palette value — falling back to the theme label color for null, empty, or unrecognized foregrounds. That fallback is the right failure mode for truecolor/256-color sequences anser passes through: they render readable rather than as an arbitrary, possibly-invisible rgb. `bg` stays pass-through (`rgb(...)`) applied only when present, and bold/dim(0.5)/underline/italic decorations map exactly as before.

The palette is the documented single source of ANSI literals. Dark lifts `black`/`bright-black` to visible greys (`#8E8E93`/`#AEAEB2`) against the `#1C1C1E` surface; light darkens `white`/`bright-white` to greys (`#6C6C70`/`#3C3C43`) against `#F2F2F7`. These line up with `colors.secondaryBackground` in each scheme.

One dead edge: `ANSER_RGB_TO_KEY` omits a `255,255,255`→`bright-white` entry because that triple already maps to `white`, so the `bright-white` palette value and the `ALL_KEYS` test coverage of it can never be exercised by real anser output. Harmless and documented in the module header, but the `bright-white` row is effectively unreachable.

### Four-state render and summary card

`renderLogBody` resolves in order: `loader` → centered `ActivityIndicator` tinted with `colors.accent` (the old `#0000ff` is gone); `errorMsg` → `ErrorState` with a retry that clears the error and re-fetches; empty `log_chunks` → `EmptyState` with `testID="build-detail-empty-state"`; otherwise the themed log surface. `ErrorState` renders only the sanitized message string it's handed, and the render test confirms the raw `Error('raw internal failure detail')` never reaches the tree while the generic `getUserFacingError` string and a `Retry` affordance do.

The summary card guards status with `Object.values(BuildState).includes(status as BuildState)` before handing it to `StatusBadge`, which avoids indexing `DESCRIPTORS[undefined]`. Build number and branch carry `fontFamily: type.mono`; workflow, started, and duration use the regular subheadline token, so mono is confined to the two fields R5 allows. Optional fields are each conditionally rendered, so a `Partial<Build>` with missing fields degrades to omission rather than a crash — consistent with reading a runtime `Build` through a route type that only declares `{slug}`.

### Jump-to-bottom and Load Full Log controls

The jump button is an absolute `Pressable`, 44×44, `accessibilityRole="button"` with label "Jump to bottom" and a hint, rendered only when `!atBottom`. `atBottom` is tracked by an `onScroll` handler computing `contentSize.height - (layoutMeasurement.height + contentOffset.y) < 24` with `scrollEventThrottle={16}`. `onPress` calls `scrollToEnd({animated: !reduceMotion})`, so the scroll itself respects reduce-motion.

The gap is the entrance: the plan asked for an entrance animation gated on reduceMotion (animated when motion is allowed, static otherwise). The button is rendered statically in both cases with no fade/opacity animation. The accessibility contract is honored, but the animated affordance the plan described is absent. Low-risk — flagging it as a conscious accept rather than a defect.

The "Load Full Log" control moved to an `AppIcon`-based `Pressable` in `headerRight` with `accessibilityLabel="Load full log"` + hint and a 44pt target, swapping to an `ActivityIndicator` while `fullLogLoading` is true. It still calls the unchanged `getLogs(getBuildData.expiring_raw_log_url.toString())` and keeps the "not available yet" Alert guard. The effect's `exhaustive-deps` disable is retained with `[getBuildData, fullLogLoading, colors.accent]`.

Log text is selectable: `AnsiText` now takes `selectable` (default true) and threads it onto both the outer and inner `<Text>`, so copy works on the rendered log.

### Scope, naming, and route invariants

`git show --stat` on the commit lists exactly `View/AnsiText.tsx`, `View/BuidDetailView.tsx`, `View/ansiPalette.ts`, and the three test files. No other screen, nothing under `API Calls/`, and `View/APIConstants/APIConstants.tsx` is untouched. The file keeps its misspelled `BuidDetailView.tsx` name, the default export is unchanged, and the `App.tsx` route type was not widened — the screen reads the extra `Build` fields through a local `RouteBuild = Partial<Build> & {slug}` cast instead.

One bundled-but-reasonable change: the log `ScrollView` import moved from `react-native-gesture-handler` to `react-native`. The commit message calls this out (drops a `GestureHandlerRootView` dependency) and the scroll ref / `scrollToEnd` / `onScroll` / `onContentSizeChange` behavior is preserved. It's in-scope for this screen and not a forbidden-file edit.

### Test coverage

`ansiPalette.test.ts` covers `normalizeRgb` whitespace collapsing, the rgb→key mapping for bright-black and red, every key defined in both schemes, light≠dark for bright-black, and `resolveAnsiFg` for recognized triples plus null/empty/unknown fallbacks. `AnsiText.test.tsx` forces the Android palette and both schemes, asserts bright-black resolves to the scheme-specific value (and that the two differ), that default foreground follows `getColors(scheme).label`, that bold→`fontWeight:'bold'` and dim→`opacity:0.5` survive, and that text is selectable. `BuildDetailView.test.tsx` mocks `getToken`, `ApiService`, and `global.fetch`, and exercises content (summary fields `main`/`primary`/`Success`/`#142` + log text), empty state, sanitized error (asserting the raw message does not leak and Retry exists), and header `setOptions` wiring — asserting `fetch` is never called on the detail render.

Not tested: the jump-to-bottom visibility toggle (the `onScroll` threshold math and the `!atBottom` gate), the `fullLogLoading` spinner swap in the header, and the full-log success path that splits text into chunks. These are UI-state branches rather than data behavior, so the omission is acceptable, but the scroll-threshold logic is the one piece of new non-trivial computation with no direct coverage.

### Verification evidence

Taken from the commit message (not re-run, per instructions): `npm run lint` → 0 errors with only the 2 pre-existing `RadioButton.tsx` warnings; `npm test` → 21 suites / 91 tests passing. The plan's baseline was 18 suites / 74 tests, and this commit adds exactly 3 test files (ansiPalette, AnsiText, BuildDetailView), so +3 suites / +17 tests is internally consistent. No specific doubt justified a spot-check.

</details>

<details>
<summary>File map</summary>

- `View/ansiPalette.ts` (new) — single-source ANSI color table: `normalizeRgb`, `ANSER_RGB_TO_KEY`, light/dark palettes, `getAnsiPalette`, `resolveAnsiFg`.
- `View/AnsiText.tsx` — reads `useTheme()`, resolves foreground through the palette, default fg follows label color, adds `selectable` prop (default true); decorations preserved.
- `View/BuidDetailView.tsx` — summary SectionCard, themed mono log surface, four-state render, jump-to-bottom button, header Load-Full-Log with spinner; fetch bodies preserved, detail error → ErrorState, ScrollView source switched to react-native.
- `View/__tests__/ansiPalette.test.ts` (new) — palette mapping and fallback tests.
- `View/__tests__/AnsiText.test.tsx` (new) — both-scheme palette + default-fg + decoration + selectable tests.
- `View/__tests__/BuildDetailView.test.tsx` (new) — content/empty/sanitized-error/header-wiring render tests with mocked token/ApiService/fetch.

Full diff: `git show b9a9b32`.

</details>
