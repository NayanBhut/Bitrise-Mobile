# Foundation Implementation Plan — Tasks 1, 2, 3

Scope: Theme foundation (`View/Theme/`), Jest native mocks, and foundational
shared components (`View/Components/`). UI-only. This plan covers **only** tasks
1, 2, and 3 from `tasks.md`. It does not touch any screen (tasks 5–9), anything
under `API Calls/`, or `View/APIConstants/APIConstants.tsx`.

Branch `feature/ui-redesign-apple-hig` is already checked out — do not create a
worktree. For git, use `git -C "/Users/siddharthpatel/Documents/Siddharth/iOS Project/BitriseMobile"`.

## Context discovered during exploration

- RN 0.88.0, React 19.3.0, New Architecture. Node >= 22.11.
- Test stack: `jest` with `preset: '@react-native/jest-preset'`, configured in
  `jest.config.js` (a standalone file, **not** in package.json). Current config:
  `setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js']`,
  a `transformIgnorePatterns` allowing `react-native-.*`, and **no**
  `setupFilesAfterEach`/`setupFilesAfterEnv`. Tests use `react-test-renderer`
  (dev dep present) with `act`. Existing tests: `__tests__/App.test.tsx`,
  `__tests__/TokenStorage.test.ts`.
- Lint: `eslint .` extending `@react-native` (`.eslintrc.js`). Prettier 2.8.8
  (`.prettierrc.js`). TS extends `@react-native/typescript-config`.
- Both native deps are installed: `react-native-nitro-sfsymbols@2.0.0`
  (+ peer `react-native-nitro-modules@^0.37.1`) and
  `react-native-haptic-feedback@^3.0.0`.
- `View/Theme/` and `View/Components/` **do not exist yet** — both are created
  by this plan.

### nitro-sfsymbols API (verified in `node_modules/.../src/`)

- Default/named export: `import { SFSymbolView, SFSymbolWeight, SFSymbolScale,
  SFSymbolRenderingMode, SFSymbolAnimationType, minTouchTargetStyle } from
  'react-native-nitro-sfsymbols';`
- `SFSymbolViewProps`: `{ name, size?, weight?, scale?, tintColor?,
  renderingMode?, hierarchical?, palette?, animation?, opacity?, fallbackName?,
  allowFontScaling?, maxFontSizeMultiplier?, accessibilityLabel?,
  accessibilityAutoLabel?, accessibilityHint?, accessibilityRole?, style?,
  testID? }`.
  - `weight` values via `SFSymbolWeight` const object (`REGULAR`, `SEMIBOLD`, …).
  - `scale` via `SFSymbolScale` (`SMALL`/`MEDIUM`/`LARGE`).
  - `renderingMode` via `SFSymbolRenderingMode`
    (`MONOCHROME`/`HIERARCHICAL`/`PALETTE`/`MULTICOLOR`).
  - `tintColor` is a **hex string** only (monochrome tint). `hierarchical`/
    `palette` take `{ primary, secondary?, tertiary? }` hex configs.
  - `animation` is `{ type: SFSymbolAnimationType, repeating?: boolean }`.
  - Decorative by default: when no `accessibilityLabel`/`accessibilityAutoLabel`,
    the view sets `accessible={false}` and hides from screen readers.
- **Load-time native binding (important):** `index.tsx` calls
  `getHostComponent(...)` from `react-native-nitro-modules` at module import.
  Under Jest/Node this native path is unavailable, so any test that imports
  AppIcon (and therefore `SFSymbolView`) will fail unless the module is mocked.
  This is exactly why Task 2 must land before Task 3's AppIcon test runs.

### haptic-feedback API (verified)

- Default export object: `import RNHapticFeedback from
  'react-native-haptic-feedback';` with `trigger(type?, options?)`.
- Types: `import { HapticFeedbackTypes } from 'react-native-haptic-feedback';`
  — use `HapticFeedbackTypes.impactLight` for the light-impact press.
  (`notificationSuccess`/`notificationWarning` exist for later screen tasks.)
- Options shape: `{ enableVibrateFallback?: boolean,
  ignoreAndroidSystemSettings?: boolean }`. Library is a no-op where unsupported.
- The package **ships an official Jest auto-mock** at
  `node_modules/react-native-haptic-feedback/src/__mocks__/` exposing `trigger`
  etc. as `jest.fn()`. We will mock via `jest.mock(...)` in setup so buttons can
  assert `trigger` was called.

### BuildState enum (from `API Calls/BuildModel.tsx` — MUST NOT be modified)

```ts
export enum BuildState {
  Success = 'success',
  Failed = 'error',
  Abort = 'aborted',
  InProgress = 'in-progress',
  OnHold = 'on-hold',
}
```
Note the five members are `Success`, `Failed`, `Abort`, `InProgress`, `OnHold`
(member is `Abort`, string value `'aborted'`). StatusBadge maps all five.

## Forbidden — do not create, modify, rename, or move

- Anything under `API Calls/` (APIService, TokenStorage, ErrorUtils, AppsModel,
  **BuildModel**, BuildDetailModel, BranchModel). `StatusBadge` **imports**
  `BuildState` from `API Calls/BuildModel` without editing that file.
- `View/APIConstants/APIConstants.tsx`.
- Any screen file (tasks 5–9): `View/TokenForm.tsx`, `View/AppList.tsx`,
  `View/BuildLists.tsx`, `View/BuidDetailView.tsx`, `View/AnsiText.tsx`,
  `View/BuildTriggerModal/*`, `View/BuildListViews/*`, `View/RadioButton.tsx`.
- No file renames. No navigation route-name changes.

## Verification gates (JS/TS + tests only)

From the repo root:
- `npm run lint` must pass.
- `npm test` must pass.
- Do **not** run `pod install` or native iOS/Android builds.
- No hardcoded color literals in components — literals are allowed **only**
  inside `View/Theme/colors.ts` (for the Android palette).

---

# Implementation Plan

## Task 1 — Theme foundation (`View/Theme/`)

- [ ] 1. Create `View/Theme/colors.ts` with the `ThemeColors` interface and a
      `getColors(scheme)` resolver. iOS tokens use `PlatformColor(...)` with
      Apple semantic colors (`systemBackground`, `secondarySystemBackground`,
      `systemGroupedBackground`, `secondarySystemGroupedBackground`, `label`,
      `secondaryLabel`, `tertiaryLabel`, `separator`, `systemFill`), accent =
      `PlatformColor('systemBlue')`, and status tokens Success=`systemGreen`,
      Failed=`systemRed`, InProgress=`systemBlue`/`systemIndigo`,
      OnHold=`systemOrange`, Aborted=`systemGray`, destructive=`systemRed`.
      Android provides a palette keyed by `useColorScheme()` `'light'|'dark'`
      with hand-tuned hex values meeting WCAG AA (accent `#007AFF` light /
      `#0A84FF` dark). Branch on `Platform.OS === 'ios'`. `ThemeColors` field
      names follow design.md: `background`, `secondaryBackground`,
      `groupedBackground`, `secondaryGroupedBackground`, `label`,
      `secondaryLabel`, `tertiaryLabel`, `separator`, `fill`, `accent`,
      `statusSuccess`, `statusFailed`, `statusInProgress`, `statusOnHold`,
      `statusAborted`, `destructive`. Hex literals appear ONLY here (Android
      palette).
      Files: `View/Theme/colors.ts`
      Verify: part of task 1.6 (`npm test`); `npm run lint` must stay clean.

- [ ] 2. Create `View/Theme/typography.ts` exporting Apple text styles
      `largeTitle`, `title2`, `headline`, `body`, `callout`, `subheadline`,
      `footnote`, `caption` as RN `TextStyle` objects
      (`fontSize`/`lineHeight`/`fontWeight`) on the system font, with a shared
      default of `allowFontScaling: true` for Dynamic Type (document the intent;
      `allowFontScaling` is a `<Text>` prop, so also export a convenience flag/
      constant components spread). Add a `mono` family token (`Menlo` on iOS,
      `monospace` on Android, via `Platform.select`). No color literals here.
      Files: `View/Theme/typography.ts`
      Verify: `npm run lint`; covered by `npm test` in 1.6.

- [ ] 3. Create `View/Theme/spacing.ts` with 8pt grid tokens
      (`xs:4, sm:8, md:16, lg:24, xl:32`), corner radii (e.g. `radius.sm/md/lg`),
      a shared `hitSlop`, `minTouchTarget = 44`, and `maxContentWidth = 700`.
      Files: `View/Theme/spacing.ts`
      Verify: `npm run lint`; covered by `npm test` in 1.6.

- [ ] 4. Create `View/Theme/icons.ts` exporting the single-source-of-truth
      mapping `Record<IconName, { ios: string; android: string }>` with exactly
      these keys and values from design.md: apps(square.stack.3d.up/stacks),
      build(hammer/build), success(checkmark.circle.fill/check_circle),
      failed(xmark.octagon.fill/dangerous), aborted(stop.circle.fill/stop_circle),
      running(arrow.triangle.2.circlepath/sync),
      onHold(pause.circle.fill/pause_circle),
      branch(arrow.triangle.branch/fork_right), workflow(flowchart/account_tree),
      trigger(play.fill/play_arrow), abort(stop.fill/stop),
      logs(doc.text.magnifyingglass/plagiarism),
      logout(rectangle.portrait.and.arrow.right/logout), token(key.fill/key),
      show(eye/visibility), hide(eye.slash/visibility_off),
      envVar(curlybraces/data_object), error(exclamationmark.triangle.fill/error),
      empty(tray/inbox), appGlyph(hammer.circle.fill/build_circle),
      chevron(chevron.right/chevron_right). Export an `IconName` union type
      derived from the keys.
      Files: `View/Theme/icons.ts`
      Verify: `npm run lint`; covered by `npm test` in 1.6.

- [ ] 5. Create `View/Theme/useTheme.ts` exporting a `useTheme()` hook returning
      `{ colors, type, spacing, scheme, reduceMotion, boldText }`. It reads
      `useColorScheme()` for `scheme` and resolves `colors` via `getColors`;
      subscribes to `AccessibilityInfo` for `reduceMotion`
      (`isReduceMotionEnabled()` + `addEventListener('reduceMotionChanged', …)`)
      and `boldText` (`isBoldTextEnabled()` + `addEventListener('boldTextChanged',
      …)`) with `useState`/`useEffect` so the UI updates live; clean up
      listeners on unmount. `type` = typography module, `spacing` = spacing
      module.
      Files: `View/Theme/useTheme.ts`
      Verify: `npm run lint`; covered by `npm test` in 1.6.

- [ ] 6. Add the theme unit test covering `useTheme` and the colors token shape.
      Render the hook via a tiny host component with `react-test-renderer`
      (mirror the `act` pattern in `__tests__/App.test.tsx`), or test
      `getColors`/token shape directly. Assert: every `ThemeColors` key in the
      design list is present and defined for both schemes; `useTheme()` returns
      `colors`, `type`, `spacing`, `scheme`, `reduceMotion` (boolean),
      `boldText` (boolean). Mock `AccessibilityInfo` async methods so the test is
      deterministic. Place under `View/Theme/__tests__/` (jest preset discovers
      `__tests__` dirs and `.test.*`).
      Files: `View/Theme/__tests__/useTheme.test.tsx`
      Verify: `npm test` — new theme tests pass; `npm run lint` clean.

## Task 2 — Jest native mocks (enables Task 3 component tests)

- [ ] 7. Add a Jest setup file and wire it via `setupFilesAfterEach`
      (`setupFilesAfterEnv`) in `jest.config.js` (keep the existing `setupFiles`
      gesture-handler entry and `transformIgnorePatterns` unchanged). In the
      setup file:
      - `jest.mock('react-native-haptic-feedback')` to use the package's shipped
        official auto-mock (`trigger`, `impact`, etc. as `jest.fn()`), OR provide
        an inline factory exporting a default object with `trigger: jest.fn()`
        and a `HapticFeedbackTypes` stub. Prefer the shipped auto-mock so
        `HapticFeedbackTypes` enum values stay real.
      - `jest.mock('react-native-nitro-sfsymbols', ...)` with an inline factory
        returning a lightweight `SFSymbolView` (a function component rendering a
        host `View`/stub that forwards `testID`, `name`, `accessibilityLabel`)
        plus the const exports it re-exports (`SFSymbolWeight`, `SFSymbolScale`,
        `SFSymbolRenderingMode`, `SFSymbolAnimationType`, `minTouchTargetStyle`).
        This prevents `getHostComponent` from executing on Node.
      This file is global, so every component test in Task 3 inherits the mocks.
      Files: `jest.config.js` (add `setupFilesAfterEach`), `jest.setup.js` (new)
      Verify: `npm test` — existing `App.test.tsx` and `TokenStorage.test.ts`
      still pass with the new setup wired in. `npm run lint` clean.

## Task 3 — Foundational shared components (`View/Components/`)

Each component is themed via `useTheme()` (no color literals), and ships a Jest
test using `react-test-renderer`. All depend on Tasks 1 and 2 being complete.

- [ ] 8. Create `View/Components/AppIcon.tsx` with props
      `{ name: IconName, size?, weight?, scale?, color?, rendering?, effect?,
      accessibilityLabel? }`. On iOS render `SFSymbolView` using the `ios` value
      from `icons.ts`, mapping `weight`→`SFSymbolWeight`, `scale`→`SFSymbolScale`,
      `color`→`tintColor` (hex string), `rendering`→`renderingMode` (support
      hierarchical/palette), and `effect`→`animation={{ type }}` ONLY when
      `useTheme().reduceMotion === false`. On Android render the mapped Material
      Symbol glyph (use a Material Symbols text/glyph approach consistent with
      design.md's note; keep the Android icon rendering self-contained in this
      component). Decorative by default (no a11y exposure) unless
      `accessibilityLabel` is passed, in which case promote it. Add test asserting
      the iOS branch renders `SFSymbolView` with the mapped name and that
      `animation` is omitted when reduceMotion is true (mock `useTheme`).
      Files: `View/Components/AppIcon.tsx`,
      `View/Components/__tests__/AppIcon.test.tsx`
      Verify: `npm test` passes AppIcon test; `npm run lint` clean.

- [ ] 9. Create `View/Components/StatusBadge.tsx` taking a `BuildState` (import
      `{ BuildState }` from `'../../API Calls/BuildModel'` — do NOT modify that
      file) and rendering color + `AppIcon` + text label together (never color
      alone). Map each state to `{ icon, colorToken, label }`: Success→success/
      statusSuccess/"Success", Failed(`'error'`)→failed/statusFailed/"Failed",
      Abort(`'aborted'`)→aborted/statusAborted/"Aborted", InProgress→running/
      statusInProgress/"In Progress", OnHold→onHold/statusOnHold/"On Hold". For
      `InProgress` pass the running symbol with a pulse/rotate `effect` (gated on
      `reduceMotion` inside AppIcon). Test: for each state, the rendered output
      contains the AppIcon (mapped name) and the text label, and uses the correct
      color token (not color alone).
      Files: `View/Components/StatusBadge.tsx`,
      `View/Components/__tests__/StatusBadge.test.tsx`
      Verify: `npm test` passes StatusBadge test; `npm run lint` clean.

- [ ] 10. Create the three themed buttons: `View/Components/PrimaryButton.tsx`,
      `View/Components/SecondaryButton.tsx`, `View/Components/DestructiveButton.tsx`.
      Shared props: `{ title, onPress, loading?, disabled?, accessibilityHint? }`.
      All enforce a ≥44pt touch target (use `spacing.minTouchTarget` / min
      height 44), show an `ActivityIndicator` spinner in the `loading` state
      (disables press), and fire a light-impact haptic on press via
      `RNHapticFeedback.trigger(HapticFeedbackTypes.impactLight)` (no-op where
      unsupported). Primary uses `colors.accent` fill, Secondary a tinted/bordered
      style, Destructive uses `colors.destructive`. Set
      `accessibilityRole="button"`. Because the pattern is identical across the
      three files, implement as one unit (optionally a shared internal base).
      Tests (one per button, same pattern): renders title, press calls `onPress`
      and the mocked haptic `trigger`, and shows a spinner (not `onPress`) when
      `loading`.
      Files: `View/Components/PrimaryButton.tsx`,
      `View/Components/SecondaryButton.tsx`,
      `View/Components/DestructiveButton.tsx`,
      `View/Components/__tests__/PrimaryButton.test.tsx`,
      `View/Components/__tests__/SecondaryButton.test.tsx`,
      `View/Components/__tests__/DestructiveButton.test.tsx`
      Verify: `npm test` passes all three button tests; `npm run lint` clean.

- [ ] 11. Create `View/Components/SecureField.tsx` wrapping `TextInput` with
      `secureTextEntry` plus an eye/eye.slash show-hide toggle (use `AppIcon`
      names `show`/`hide` in the toggle `Pressable`, ≥44pt target,
      `accessibilityRole="button"` + label). ENFORCE secure defaults that callers
      cannot drop: `autoComplete="off"`, `autoCorrect={false}`,
      `spellCheck={false}`, `importantForAutofill="no"`, `textContentType="none"`,
      and `autoCapitalize="none"` (matching the existing TokenForm pattern).
      Props forward `value`, `onChangeText`, `placeholder`, etc., but the five
      secure props are hard-set and not overridable. Themed via `useTheme()`.
      Test: asserts all five secure props are present on the rendered `TextInput`
      and that toggling flips `secureTextEntry`.
      Files: `View/Components/SecureField.tsx`,
      `View/Components/__tests__/SecureField.test.tsx`
      Verify: `npm test` passes SecureField test (secure props asserted);
      `npm run lint` clean.

- [ ] 12. Final gate: from the repo root run `npm run lint` and `npm test` and
      confirm both are green, with all new Theme + Component tests passing and
      the pre-existing `App.test.tsx` / `TokenStorage.test.ts` still passing. Do
      not run `pod install` or native builds.
      Verify: `npm run lint` exits 0; `npm test` exits 0.

## Notes, assumptions, and uncertainties

- **Android icon rendering (AppIcon):** design.md leaves the exact Android
  Material Symbols font package open ("finalized in the AppIcon task"). No
  vector-icons package is currently in `package.json`. Assumption: keep Android
  rendering self-contained without adding a new native font dependency in this
  foundation pass (e.g. render the mapped glyph/name via `<Text>` using the
  platform `monospace`/default family, or a minimal placeholder), since adding a
  font package is a native/asset change outside the JS-only verification gate.
  The `icons.ts` Android values are still recorded for when the font is wired in
  a later task. Flag for the implementer: if a Material Symbols font is desired
  now, it needs a dependency + native linking, which this plan intentionally
  avoids.
- **nitro-sfsymbols is uninstrumentable on Node** without the Task 2 mock, so
  Task 3 strictly depends on Task 2. The AppIcon test relies on the inline
  `SFSymbolView` stub from the jest setup.
- **Haptic mock:** prefer the package's shipped official auto-mock via
  `jest.mock('react-native-haptic-feedback')` so `HapticFeedbackTypes` keeps
  real enum values while `trigger` is a spy. If the auto-mock path is not picked
  up by the preset, fall back to an inline factory in `jest.setup.js`.
- **`type` key name:** `useTheme()` returns the typography module under the key
  `type` (per design.md), not `typography`. Keep this exact name so later screen
  tasks match.
- **No color literals rule:** verified the only allowed location is
  `View/Theme/colors.ts` (Android palette). Buttons/badges/fields must pull every
  color from `useTheme().colors`.
```