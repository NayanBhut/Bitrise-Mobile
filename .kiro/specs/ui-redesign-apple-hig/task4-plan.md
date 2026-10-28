# Task 4 — Implementation Plan: Layout & State Shared Components

UI-only refactor on branch `feature/ui-redesign-apple-hig` (already checked out; no worktree).
Repo root: `/Users/siddharthpatel/Documents/Siddharth/iOS Project/BitriseMobile`.

Scope: build five shared components in `View/Components/` — `SectionCard`, `ListRow`,
`EmptyState`, `ErrorState`, `SkeletonRow` — each consuming `useTheme()` with NO hardcoded
color literals, each with a `react-test-renderer` Jest test under
`View/Components/__tests__/`. Do NOT touch any screen (tasks 5–9), `API Calls/`,
`View/APIConstants/APIConstants.tsx`, navigation route names, or re-implement tasks 1–3.

## Grounding findings (from reading the existing foundation)

- **Theme tokens confirmed present** in `View/Theme/colors.ts` (`ThemeColors`):
  `background`, `secondaryBackground`, `groupedBackground`, `secondaryGroupedBackground`,
  `label`, `secondaryLabel`, `tertiaryLabel`, `separator`, `fill`, `accent`, status tokens,
  `destructive`, `onFill`. All tokens needed by task 4 exist — no new tokens required.
- **Icon names confirmed present** in `View/Theme/icons.ts`: `chevron` (`chevron.right` /
  `chevron_right`), `empty` (`tray` / `inbox`), `error` (`exclamationmark.triangle.fill` /
  `error`). No new icons required.
- `useTheme()` returns `{ colors, type, spacing, scheme, reduceMotion, boldText }`.
  `spacing` is the module namespace: use `spacing.spacing.{xs,sm,md,lg,xl}`,
  `spacing.radius.{sm,md,lg}`, `spacing.minTouchTarget` (44), `spacing.maxContentWidth`.
  `type` is the typography module: `type.largeTitle/title2/headline/body/callout/
  subheadline/footnote/caption` and `type.dynamicType` (spread for Dynamic Type).
- **Established component conventions to match exactly** (from `BaseButton.tsx`,
  `SecureField.tsx`, `StatusBadge.tsx`, `AppIcon.tsx`):
  - Both a named export and `export default` for each component.
  - Build style objects as typed `ViewStyle`/`TextStyle` variables inside the component
    (theme-dependent) or in `StyleSheet.create` (static). Do NOT inline literal style
    objects in JSX — `react-native/no-inline-styles` is active and will warn (see
    `RadioButton.tsx`). Passing a style *variable* or a `styles.x` reference into JSX is fine.
  - Icons go through `<AppIcon name=... />`, never raw symbol strings.
  - Reuse `PrimaryButton` / `SecondaryButton` for actions (they wrap `BaseButton`, which
    already enforces 44pt targets, loading, and light-impact haptics).
- **Test conventions to match** (from `__tests__/*.test.tsx`): file starts with
  `/** @format */`, `import 'react-native';`, `@jest/globals`, `renderer, {act}` from
  `react-test-renderer`, wrap `renderer.create` in `await act(async () => {...})`, query with
  `findAllByType` / `findAllByProps` / `findByType`, trigger handlers via
  `.props.onPress()`. The `AppIcon` test shows the pattern for mocking `useTheme` per test
  with a `let mockReduceMotion` toggle.
- **Reanimated under Jest — critical**: `react-native-reanimated@4.7.1` is a dependency but
  is NOT yet imported anywhere. Importing it (or even its shipped `react-native-reanimated/mock`)
  throws under Jest (`Cannot read properties of undefined (reading 'loadUnpackersWithCode')`)
  because `react-native-worklets` tries to load native bindings at import time. There is no
  reanimated mock in `jest.setup.js` today. A self-contained inline
  `jest.mock('react-native-reanimated', () => ({...}))` factory (not requiring the real module)
  works — verified by probe. **Decision:** add this mock to `jest.setup.js` (global, matching
  the existing `react-native-nitro-sfsymbols` / `react-native-haptic-feedback` inline mocks,
  and future-proofing tasks 7–8 which also use reanimated per design.md). Item 1 below.
- **Verified baselines (must not regress):** `npm test` = 9 suites / 32 tests passing;
  `npm run lint` = 0 errors, 5 pre-existing warnings (`View/BuildLists.tsx` ×3,
  `View/RadioButton.tsx` ×2).

## Design decisions (rationale, 1–2 sentences each)

- **Reanimated mock in `jest.setup.js`, not per-test.** The crash is environmental and shared;
  one global inline mock matches the existing native-mock pattern in that file and keeps
  `SkeletonRow.test.tsx` focused on behavior. It is additive and cannot affect the other
  suites (none import reanimated).
- **`ListRow` accessibility model.** When pressable or when a subtitle exists the row reads as
  one element: set `accessible={true}`, `accessibilityRole="button"` only when `onPress` is
  provided, and a single combined `accessibilityLabel` = `title` + (subtitle ? `, ${subtitle}` : '').
  This mirrors the design's "Build 142, failed, branch main" composed-label rule.
- **Default accessory is a `chevron` AppIcon only when pressable.** Matches HIG disclosure
  affordance; a custom `accessory` prop overrides it; non-pressable rows show no accessory
  unless one is passed.
- **`SkeletonRow` gates on `reduceMotion`.** When `reduceMotion` is true, render a static
  dimmed placeholder (fixed opacity, no animated style, no `withRepeat`); otherwise drive an
  opacity shimmer via reanimated. This satisfies R12 and is the same gate `AppIcon`/`StatusBadge`
  already use.
- **State components reuse the button family** (`PrimaryButton`/`SecondaryButton`) rather than
  re-implementing buttons, so 44pt targets, haptics, and loading come for free and stay consistent.

## Ordered implementation plan

- [ ] 1. Add a self-contained reanimated mock to `jest.setup.js` so components importing
      `react-native-reanimated` can be unit-tested on Node. Append a
      `jest.mock('react-native-reanimated', () => {...})` factory that returns:
      `__esModule: true`; `default` = an object whose `View` (and `Text`, `ScrollView` for
      safety) are `React.forwardRef` wrappers over the RN primitives forwarding props;
      hooks/helpers as plain functions: `useSharedValue(init) => ({value: init})`,
      `useAnimatedStyle(fn) => fn()`, `withRepeat(v) => v`, `withTiming(v) => v`,
      `withSequence(...v) => v[v.length-1]`, `withDelay(_, v) => v`, `cancelAnimation()` no-op,
      and `Easing` with `inOut/ease/linear/bezier` returning no-op functions. Do NOT require the
      real module inside the factory.
      Files: `jest.setup.js`
      Verify: `npm test` — all existing 32 tests still pass (no new suite yet; this must not
      regress the baseline).

- [ ] 2. Create `SectionCard.tsx` — a grouped (inset-grouped look) container with an optional
      header title that renders its children inside a rounded card.
      Props interface `SectionCardProps`: `{ title?: string; footer?: string; children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }`.
      Behavior: optional header `title` rendered above the card as uppercase-ish grouped
      header using `type.footnote` + `colors.secondaryLabel` (do not force text-transform if it
      complicates tests; just style it). The card body uses
      `backgroundColor: colors.secondaryGroupedBackground`, `borderRadius: spacing.radius.lg`,
      `padding: spacing.spacing.md`; the outer wrapper may use `colors.groupedBackground` as
      its surrounding context but the card itself is the `secondaryGroupedBackground` surface.
      Constrain width with `maxWidth: spacing.maxContentWidth` and center via
      `alignSelf: 'center'`/`width: '100%'`. Optional `footer` rendered below in
      `type.footnote` + `colors.tertiaryLabel`. No color literals. Named + default export.
      Files: `View/Components/SectionCard.tsx`
      Verify: `npx jest View/Components/__tests__/SectionCard.test.tsx` once item 7 exists;
      for now `npx tsc --noEmit` (or rely on item 12 gate) — component compiles and is exported.

- [ ] 3. Create `ListRow.tsx` — an inset grouped row with optional leading `AppIcon`, a title,
      optional subtitle, and optional trailing accessory (default `chevron` AppIcon when
      pressable).
      Props interface `ListRowProps`:
      `{ title: string; subtitle?: string; leadingIcon?: IconName; accessory?: React.ReactNode; onPress?: () => void; accessibilityHint?: string; testID?: string; style?: StyleProp<ViewStyle> }`
      (`IconName` imported from `../Theme/icons`).
      Behavior:
        - Root is `Pressable` when `onPress` is set, else a `View`.
        - `minHeight: spacing.minTouchTarget` (44), `flexDirection: 'row'`,
          `alignItems: 'center'`, `paddingVertical: spacing.spacing.sm`,
          `paddingHorizontal: spacing.spacing.md`,
          `backgroundColor: colors.secondaryGroupedBackground`.
        - Leading: if `leadingIcon`, render `<AppIcon name={leadingIcon} size={22} />`
          (decorative — no label) with `marginRight: spacing.spacing.md`.
        - Center: `title` in `type.body`/`type.headline` + `colors.label`; `subtitle` (if any)
          in `type.subheadline`/`type.footnote` + `colors.secondaryLabel`; wrap in a
          `flex: 1` column so the accessory stays right-aligned.
        - Trailing accessory: if `accessory` prop provided, render it; else if `onPress`
          provided, render `<AppIcon name="chevron" size={16} color={...tertiaryLabel string} />`
          (guard `typeof color === 'string'` like `StatusBadge` does); else nothing.
        - Accessibility: set `accessible={true}`; build `combinedLabel = subtitle ? \`${title}, ${subtitle}\` : title`
          and set `accessibilityLabel={combinedLabel}`; set `accessibilityRole="button"` only
          when `onPress` is provided; forward `accessibilityHint`.
      No color literals. Named + default export.
      Files: `View/Components/ListRow.tsx`
      Verify: covered by item 8 test run; compiles under the item 12 gate.

- [ ] 4. Create `EmptyState.tsx` — centered symbol + title + message + optional action button.
      Props interface `EmptyStateProps`:
      `{ icon?: IconName; title: string; message?: string; actionTitle?: string; onAction?: () => void; actionVariant?: 'primary' | 'secondary'; testID?: string }`.
      Behavior: centered column (`alignItems: 'center'`, `justifyContent: 'center'`,
      `padding: spacing.spacing.lg`, `maxWidth: spacing.maxContentWidth`, `alignSelf: 'center'`).
      Render `<AppIcon name={icon ?? 'empty'} size={48} color={...secondaryLabel string guard} />`;
      `title` in `type.title2`/`type.headline` + `colors.label`; `message` (if any) in
      `type.subheadline` + `colors.secondaryLabel`, `textAlign: 'center'`. When both
      `actionTitle` and `onAction` are provided, render `SecondaryButton` by default or
      `PrimaryButton` when `actionVariant === 'primary'`, passing `title={actionTitle}`
      `onPress={onAction}`. No color literals. Named + default export.
      Files: `View/Components/EmptyState.tsx`
      Verify: covered by item 9 test run; compiles under the item 12 gate.

- [ ] 5. Create `ErrorState.tsx` — centered `error` icon + a message string (caller always
      passes a sanitized `getUserFacingError()` string) + a Retry button wired to `onRetry`.
      Props interface `ErrorStateProps`:
      `{ message: string; onRetry: () => void; retryTitle?: string; retryVariant?: 'primary' | 'secondary'; testID?: string }`.
      Behavior: same centered layout as `EmptyState`. Render `<AppIcon name="error" size={48}
      color={...statusFailed or destructive string guard} />`; render EXACTLY the `message`
      string passed in (no formatting, no error-object inspection, no extra fields — ErrorState
      must not expose anything beyond the provided string) in `type.subheadline` +
      `colors.label`/`secondaryLabel`, `textAlign: 'center'`. Render a Retry button:
      `PrimaryButton` by default (or `SecondaryButton` when `retryVariant === 'secondary'`)
      with `title={retryTitle ?? 'Retry'}` and `onPress={onRetry}`. No color literals.
      Named + default export.
      Files: `View/Components/ErrorState.tsx`
      Verify: covered by item 10 test run; compiles under the item 12 gate.

- [ ] 6. Create `SkeletonRow.tsx` — a placeholder row with a reanimated shimmer that is DISABLED
      (static dimmed placeholder) when `reduceMotion` from `useTheme()` is true.
      Props interface `SkeletonRowProps`: `{ lines?: 1 | 2; testID?: string; style?: StyleProp<ViewStyle> }`
      (default `lines = 2`: a wider title bar + a narrower subtitle bar; `lines = 1` renders one bar).
      Behavior:
        - Import `Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming }` from
          `react-native-reanimated`.
        - Row container: `minHeight: spacing.minTouchTarget`, `flexDirection: 'row'`/column as
          needed, `padding`, `backgroundColor: colors.secondaryGroupedBackground`.
        - Placeholder bars: `backgroundColor: colors.fill`, `borderRadius: spacing.radius.sm`,
          fixed heights (~12–16) and widths (e.g. `'60%'`, `'40%'`).
        - Motion gate: when `reduceMotion` is true, render the bars as plain `View`s with a
          fixed dimmed `opacity` (e.g. 0.5) — do NOT create shared values or animated styles.
          When false, drive a shared value with
          `useSharedValue(0.3)` + `useEffect(() => { v.value = withRepeat(withTiming(1,
          {duration: 800}), -1, true); }, [v])`, build `useAnimatedStyle(() => ({opacity:
          v.value}))`, and render the bars inside `Animated.View` with that style.
        - IMPORTANT: call hooks unconditionally (React rules of hooks); branch only on what you
          render. One clean approach: always create the shared value + animated style, start the
          `withRepeat` inside `useEffect` only when `!reduceMotion`, and choose `Animated.View`
          vs `View` (with static opacity) at render time based on `reduceMotion`.
      No color literals. Named + default export.
      Files: `View/Components/SkeletonRow.tsx`
      Verify: covered by item 11 test run; compiles under the item 12 gate.

- [ ] 7. Add `View/Components/__tests__/SectionCard.test.tsx`.
      Cases: (a) renders the header `title` text when provided; (b) renders `children`
      (pass a `<Text testID="child">` and assert it is found); (c) renders the `footer` when
      provided. Use the standard `await act(async () => { tree = renderer.create(...) })`
      pattern and `findAllByType(Text)` / `findAllByProps({testID: 'child'})`.
      Files: `View/Components/__tests__/SectionCard.test.tsx`
      Verify: `npx jest View/Components/__tests__/SectionCard.test.tsx` — all cases pass.

- [ ] 8. Add `View/Components/__tests__/ListRow.test.tsx`.
      Cases: (a) combined accessibilityLabel — render with `title="Build 142"`
      `subtitle="main"` and assert the root (query by `accessibilityRole: 'button'` when
      pressable, or `findAllByProps({accessible: true})`) has
      `accessibilityLabel === 'Build 142, main'`; (b) default chevron — render with an
      `onPress` and no `accessory`, assert an `AppIcon`/`SFSymbolView` with the mapped
      `icons.chevron.ios` name appears (import `SFSymbolView` from
      `react-native-nitro-sfsymbols` and `icons` from `../../Theme/icons`, mirroring
      `StatusBadge.test.tsx`); (c) no chevron when not pressable — render without `onPress`
      and assert no chevron symbol; (d) `onPress` fires — call
      `findAllByProps({accessibilityRole: 'button'})[0].props.onPress()` and assert the mock
      was called; (e) `accessibilityRole` is `'button'` only when pressable.
      Files: `View/Components/__tests__/ListRow.test.tsx`
      Verify: `npx jest View/Components/__tests__/ListRow.test.tsx` — all cases pass.

- [ ] 9. Add `View/Components/__tests__/EmptyState.test.tsx`.
      Cases: (a) renders `title` and `message` text; (b) default `empty` icon — assert an
      `SFSymbolView` with `icons.empty.ios` name when no `icon` prop; (c) action button —
      render with `actionTitle` + `onAction`, assert the button label text renders and calling
      its `onPress` (`findAllByProps({accessibilityRole: 'button'})[0].props.onPress()`)
      invokes `onAction`; (d) no action button when `actionTitle`/`onAction` omitted.
      Files: `View/Components/__tests__/EmptyState.test.tsx`
      Verify: `npx jest View/Components/__tests__/EmptyState.test.tsx` — all cases pass.

- [ ] 10. Add `View/Components/__tests__/ErrorState.test.tsx`.
      Cases: (a) the passed `message` string renders verbatim (assert via
      `findAllByType(Text).map(t => t.props.children)` contains the exact message);
      (b) the `error` icon renders (`SFSymbolView` with `icons.error.ios`);
      (c) Retry calls `onRetry` — find the button by `accessibilityRole: 'button'`, call its
      `onPress`, assert the mock fired once; (d) default retry label is `'Retry'`.
      Files: `View/Components/__tests__/ErrorState.test.tsx`
      Verify: `npx jest View/Components/__tests__/ErrorState.test.tsx` — all cases pass.

- [ ] 11. Add `View/Components/__tests__/SkeletonRow.test.tsx`, covering BOTH reduceMotion
      branches. Follow the `AppIcon.test.tsx` pattern of mocking `useTheme` with a toggle:
      `let mockReduceMotion = false;` and
      `jest.mock('../../Theme/useTheme', () => ({ useTheme: () => ({ colors: {...}, spacing: require('../../Theme/spacing'), type: require('../../Theme/typography'), reduceMotion: mockReduceMotion }) }))`
      — supply the handful of `colors` tokens SkeletonRow reads (`secondaryGroupedBackground`,
      `fill`) as plain strings in the mock so no native color resolution is needed. The global
      reanimated mock from item 1 is already active.
      Cases: (a) reduceMotion false — component renders without throwing and produces at least
      one placeholder node (query by a `testID` you set on the bars, e.g. `skeleton-bar`);
      (b) reduceMotion true — set `mockReduceMotion = true` in the test, render, and assert it
      still renders the placeholder (static). If distinguishing static vs animated is feasible,
      assert the animated path is not taken when reduceMotion is true (e.g. expose a `testID`
      `skeleton-static` vs `skeleton-animated` on the chosen wrapper and assert which is
      present); otherwise assert both branches render a placeholder without error.
      Files: `View/Components/__tests__/SkeletonRow.test.tsx`
      Verify: `npx jest View/Components/__tests__/SkeletonRow.test.tsx` — both branches pass.

- [ ] 12. Final verification gate (run from repo root).
      Files: none (verification only).
      Verify:
        - `npm run lint` — exits with 0 errors. The 5 pre-existing warnings
          (`View/BuildLists.tsx` ×3, `View/RadioButton.tsx` ×2) are acceptable and must NOT
          increase; the five new component files and five new test files must contribute 0 new
          warnings/errors (watch `react-native/no-inline-styles` — keep style objects as
          variables, not inline literals in JSX).
        - `npm test` — all suites green: the prior 9 suites / 32 tests still pass PLUS the five
          new suites (SectionCard, ListRow, EmptyState, ErrorState, SkeletonRow) pass.
        - Do NOT run native build or `pod install`; this task is JS/TS + Jest only.

## Out of scope (do not touch)
Screens (`TokenForm.tsx`, `AppList.tsx`, `BuildLists.tsx`, `BuidDetailView.tsx`,
`BuildTriggerModal/*`, `AnsiText.tsx`, `BuildListViews/*`), `API Calls/`,
`View/APIConstants/APIConstants.tsx`, navigation route names, file renames, and tasks 1–3
(theme + foundation components are reused as-is).
