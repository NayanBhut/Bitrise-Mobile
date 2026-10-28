# Task 10 (test + cleanup sweep) & Task 11 (UI_REDESIGN.md) Review

Commit: `9f86e42` on `feature/ui-redesign-apple-hig` (diff vs `HEAD~1` = `e18347a`).

## Verdict: APPROVED — no blocking findings.

## Scope of diff (clean)

18 files, +605/-96. Changed: `UI_REDESIGN.md` (new), `View/ansiPalette.ts`,
`View/AnsiText.tsx`, `View/Components/{AppIcon,SkeletonRow,StatusBadge,ListRow,EmptyState,ErrorState}.tsx`,
`View/{AppList,BuidDetailView}.tsx`, `View/BuildListViews/{BuildItem,BuildBranch}.tsx`,
and five test files (`AppIcon`, `BaseButton`, `SkeletonRow`, `AnsiText`, `ansiPalette`).
`git diff --name-only` confirms **nothing under `API Calls/`** and **`View/APIConstants/APIConstants.tsx` untouched**; `--find-renames` shows **no renames** (misspelled `BuidDetailView.tsx` kept); no route-name changes. The code edits are the targeted finding fixes plus the AppIcon-typing follow-through at call sites — no redesign.

## 1. The four prior non-blocking findings

### (a) AppIcon iOS tint — RESOLVED (correctly, with honest documentation)
`AppIcon.color` is widened from `string` to `ColorToken`. On iOS, `tint = typeof color === 'string' ? color : undefined` forwards a hex string and omits a `PlatformColor` `OpaqueColorValue`. This is the correct resolution given the native constraint I verified: `react-native-nitro-sfsymbols` types `tintColor?: string` (`node_modules/.../types.ts:196`, `NitroSfsymbols.nitro.ts:29`) — a Nitro view that parses tintColor as hex and does **not** accept an OpaqueColorValue. Since every iOS semantic token in `colors.ts` is a `PlatformColor(...)` (confirmed: `label`, `secondaryLabel`, `tertiaryLabel`, `statusFailed`, etc.), those keep the dynamic system label tint on iOS — which is system-adaptive and AA-correct, not a dropped value. The only iOS string token (`onFill: 'white'`) is forwarded as before. The call-site string guards were removed in ListRow/EmptyState/ErrorState/StatusBadge/AppList/BuildItem/BuildBranch/BuildDetailView; Android now receives the hex token directly (`color != null` guard). The commit message and `UI_REDESIGN.md` (“Icon tint note (iOS)”) document the mechanism accurately. Test `AppIcon.test.tsx` asserts a hex string is applied as `tintColor` and a PlatformColor-shaped token yields `undefined`.

### (b) SkeletonRow unique testIDs — RESOLVED
Bars now carry `skeleton-bar-title` and `skeleton-bar-subtitle` (was duplicate `skeleton-bar`). `SkeletonRow.test.tsx` asserts both IDs render exactly once in the 2-line case and that `skeleton-bar-subtitle` is absent when `lines={1}`, across both reduce-motion branches.

### (c) BuildDetailView jump-to-bottom — RESOLVED
Extracted into `JumpToBottomButton`. Hooks (`useSharedValue`, `useAnimatedStyle`, `useEffect`) run unconditionally; `opacity` starts at `reduceMotion ? 1 : 0` and `useEffect` runs `withTiming(1, {duration:200})` only when motion is allowed, else sets `1` immediately. Under Reduce Motion it returns a plain `<View>` (no `Animated.View`), static but fully functional — the `Pressable` with role/label/hint and the `onPress` scroll (`animated: !reduceMotion`) are intact in both branches. Matches the plan’s “animated when allowed, static otherwise.”

### (d) AnsiText bright-white reachable — RESOLVED (verified against real anser)
New `ANSER_RAW_TO_KEY` keys on anser’s exact emitted strings; `ansiKeyForFg()` prefers the exact match then falls back to the normalized map. Spot-check (one narrow run) confirmed the premise: anser emits `"255,255,255"` (no spaces) for white (37) and `"255, 255, 255"` (with spaces) for bright-white (97), so both are now distinctly reachable. `ansiPalette.test.ts` asserts `ansiKeyForFg` distinguishes the two; `AnsiText.test.tsx` renders real `\u001b[37m` and `\u001b[97m` end-to-end and asserts distinct palette values — proving bright-white is live, not dead.

## 2. Test coverage

- **All 12 components in `View/Components/` have a test** (AppIcon, BaseButton, DestructiveButton, EmptyState, ErrorState, ListRow, PrimaryButton, SecondaryButton, SectionCard, SecureField, SkeletonRow, StatusBadge). BaseButton test is new — covers the `disabled` prop and composed `accessibilityState` the wrappers don’t exercise.
- **All five screens have mocked render tests:** `TokenForm`, `AppList`, `BuildLists`, `BuildDetailView` (`View/__tests__/`) and `BuildTriggerModal` (`View/BuildTriggerModal/__tests__/`). Each mocks `API Calls/TokenStorage` (keychain) and `API Calls/APIService`; `BuildDetailView` additionally mocks `global.fetch` and asserts fetch is **not** called on the detail render. No real network/keychain.
- **App.test.tsx** renders the full `App` (native-stack navigator from task 6.5) under `act`; passes per recorded evidence. Unchanged in this diff, still valid.
- **Snapshots:** none exist in the project; `UI_REDESIGN.md` states this explicitly, so there are no stale snapshots to update.

## 3. Hard constraints
- No `API Calls/` or `APIConstants.tsx` changes (verified via `git diff --name-only`).
- No renames; `BuidDetailView.tsx` misspelling preserved.
- No route-name changes (diff touches no navigator/route definitions).
- Behavior/security preserved: this diff is UI-tint/typing + test + doc only. The AppIcon color change is presentational; no fetch body, keychain call, pagination guard, trigger/abort payload, secret-wipe, masking, or `getUserFacingError`-only error path is touched. Prior task 5–9 reviews already established those behaviors as preserved, and nothing here regresses them.

## 4. UI_REDESIGN.md
Covers goal, dependency rationale (icon lib / haptics / native-stack / animations), theme system (colors/typography/spacing/icons/useTheme + icon table + iOS tint note), color rationale (accessible, status-never-color-alone, WCAG AA), per-screen before/after for all five screens, shared component library, accessibility, quality gates, and a clearly-labeled **“Manual verification pending (task 12 — NOT done)”** section enumerating `pod install`, the device/appearance matrix, and simulator-only behaviors. Quality-gate counts match the commit.

## 5. Scope discipline
Only targeted fixes + tests + doc changed. No screen was redesigned; the non-test source edits are mechanical removals of the obsolete `typeof … === 'string'` guards plus the one extracted `JumpToBottomButton` and the ansiPalette exact-string map.

## Verification evidence (recorded, not re-run)
Commit message: `npm run lint` → 0 errors / 2 warnings (both pre-existing in `RadioButton.tsx`); `npm test` → 23 suites / 105 tests passing (was 22 / 95). Internally consistent: +1 suite = new `BaseButton.test.tsx`; +10 tests fits BaseButton plus added cases in AppIcon/SkeletonRow/AnsiText/ansiPalette. One narrow spot-check was run (anser white vs bright-white spacing) to resolve a specific doubt on finding (d); suites were not re-run.
