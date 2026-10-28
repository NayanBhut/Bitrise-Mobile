# Layout & state shared components (SectionCard, ListRow, EmptyState, ErrorState, SkeletonRow)

Task 4 adds the five layout/state components the HIG redesign needs before any screen refactor: an inset-grouped `SectionCard`, a `ListRow`, and the `EmptyState` / `ErrorState` / `SkeletonRow` placeholders. All five consume `useTheme()` with no hardcoded color literals, reuse the existing foundation (`AppIcon`, `PrimaryButton`/`SecondaryButton`, theme tokens), and ship a `react-test-renderer` suite each. The only infra change is a self-contained `react-native-reanimated` mock added to `jest.setup.js` so the shimmer component can be unit-tested on Node. The diff is additive (11 new files, 883 insertions) and touches no screens, no `API Calls/`, and no `APIConstants.tsx`.

Watch for: on iOS the icon tint colors pass through a `typeof color === 'string'` guard that is always false for `PlatformColor` values, so `ListRow`'s chevron, `ErrorState`'s error symbol, and `EmptyState`'s symbol render in the system default label color rather than the intended `tertiaryLabel` / `statusFailed` / `secondaryLabel` tint (confirmed, non-blocking — the fallback is sensible and the guard is the same pattern the approved `StatusBadge` uses).

**Verdict**: APPROVED

## High-level view

The component set matches the plan's contracts exactly. `SectionCard` renders an optional uppercase footnote header, a rounded `secondaryGroupedBackground` card body, and an optional tertiary footer, width-capped at `maxContentWidth`. `ListRow` composes a single `accessibilityLabel` (`title` or `title, subtitle`), sets `accessible`, takes `accessibilityRole="button"` only when `onPress` is given, defaults to a chevron accessory only when pressable, and enforces `minHeight: 44`. `EmptyState` and `ErrorState` are centered symbol + copy layouts that delegate their action/retry buttons to the shared button family; `ErrorState` renders the caller-supplied message verbatim with no inspection or formatting, exactly as the sanitization contract requires.

`SkeletonRow` is the only component with runtime branching: hooks (`useSharedValue`, `useAnimatedStyle`, `useEffect`) run unconditionally and only the `withRepeat` start and the chosen wrapper (`Animated.View` vs static `View`) are gated on `reduceMotion`. This respects the rules of hooks and satisfies R12 (motion off → static dimmed placeholder).

The icon tint guard is the one behavioral wrinkle: `AppIcon.color` is typed `string`, so every call site that wants a themed tint checks `typeof token === 'string'` and passes `undefined` on iOS (where tokens are `OpaqueColorValue`). The icons therefore fall back to the system label color on iOS. This is consistent with the existing foundation and does not break anything, but it means the status-red error icon and the dimmed chevron won't actually be tinted on the primary platform.

Test coverage hits every assertion the task named: the combined `ListRow` label, the default chevron when pressable and its absence when static, `onPress`/`onRetry`/`onAction` firing, the verbatim `ErrorState` message, the default `Retry` label, and both `SkeletonRow` reduce-motion branches plus `lines={1}`. The reanimated mock is self-contained (no real module required) and additive, so the prior suites are unaffected — the recorded evidence confirms the baseline 9 suites / 32 tests still pass alongside the 5 new suites.

<details>
<summary>Issues (2)</summary>

1. **iOS icon tint is dropped** — the `typeof color === 'string'` guard in `ListRow`, `ErrorState`, and `EmptyState` is always false for `PlatformColor` tokens on iOS, so the chevron, error, and empty symbols render in the default label color instead of their intended tint. Non-blocking; if colored icons are wanted, `AppIcon.color` would need to accept `ColorToken` and pass it through to `tintColor`. A follow-up concern for the AppIcon/typing layer, not task 4.
2. **Duplicate `testID="skeleton-bar"`** — both skeleton bars share one testID. Harmless for the current `findAllByProps` count assertions, but worth a note if anyone later queries a single bar by id.

</details>

<details>
<summary>Details</summary>

### Component contracts vs the plan

Each component's prop interface matches the plan verbatim: `SectionCardProps` (`title?`, `footer?`, `children`, `style?`, `testID?`), `ListRowProps` (`title`, `subtitle?`, `leadingIcon?`, `accessory?`, `onPress?`, `accessibilityHint?`, `testID?`, `style?`), `EmptyStateProps`, `ErrorStateProps`, and `SkeletonRowProps` (`lines?: 1 | 2`). All export both a named and default export, build style objects as typed `ViewStyle`/`TextStyle` variables or via `StyleSheet.create` rather than inlining literals in JSX, and route every icon through `<AppIcon>`. The spacing/type tokens are read through the module namespace (`spacing.spacing.*`, `spacing.radius.*`, `spacing.minTouchTarget`, `spacing.maxContentWidth`, `type.footnote/body/title2/subheadline`) as the foundation expects.

### ListRow accessibility and the pressable/static split

The row builds `combinedLabel = subtitle ? \`${title}, ${subtitle}\` : title` and applies it on both branches. When `onPress` is set it renders a `Pressable` with `accessible`, `accessibilityRole="button"`, the combined label, and the forwarded hint; otherwise a plain `View` with `accessible` and the label but no role. That is the exact design rule — the role appears only for interactive rows — and the test suite asserts both the `'Build 142, main'` label and that `findAllByProps({accessibilityRole: 'button'})` is empty for a static row. The default chevron is gated on `pressable`, a custom `accessory` overrides it, and a non-pressable row with no accessory renders nothing trailing. `minHeight: spacing.minTouchTarget` (44) is applied to the container.

### ErrorState message handling

`ErrorState` renders `{message}` directly into a single `Text` with no interpolation, no error-object access, and no additional fields — honoring the contract that the caller passes an already-sanitized `getUserFacingError()` string and the component exposes nothing more. The Retry button defaults to `PrimaryButton` with title `Retry` and is wired straight to `onRetry`; `retryVariant === 'secondary'` swaps in `SecondaryButton`. The test asserts the message renders verbatim, the default label is `Retry`, and `onRetry` fires once on press.

### SkeletonRow motion gating

```
useSharedValue / useAnimatedStyle / useEffect   <- always called
                         |
          reduceMotion ? static View : Animated.View   <- only render branches
```

The shared value and animated style are created unconditionally; the `withRepeat(withTiming(...))` only starts inside `useEffect` when `!reduceMotion`; and the render picks a static `View` (fixed `opacity: 0.5`, `testID="skeleton-static"`) or an `Animated.View` (`testID="skeleton-animated"`) accordingly. Both bars carry `testID="skeleton-bar"` and the container is hidden from assistive tech via `accessibilityElementsHidden`. The suite exercises both branches by toggling `mockReduceMotion` and counts distinct host nodes (filtering `typeof node.type === 'string'`) to avoid double-counting composite instances, plus a `lines={1}` case asserting a single bar.

### Reanimated mock

The `jest.setup.js` addition is a self-contained factory that never requires the real module: `default.View/Text/ScrollView` are `forwardRef` wrappers over the RN primitives, `createAnimatedComponent` is provided (gesture-handler's jestSetup needs it), and the hooks/helpers resolve synchronously (`useSharedValue(init) => ({value: init})`, `useAnimatedStyle(fn) => fn()`, `withRepeat`/`withTiming` identity, `Easing` no-ops). It mirrors the existing `react-native-nitro-sfsymbols` and `react-native-haptic-feedback` inline mocks in the same file and is additive — no other suite imports reanimated, and the recorded evidence confirms `App.test.tsx` stays green.

### Scope and reuse

Only the five component files, their five test files, and `jest.setup.js` changed. No screen, nothing under `API Calls/`, `View/APIConstants/APIConstants.tsx`, no renames, no route-name changes, and tasks 1–3 are untouched. Actions reuse `PrimaryButton`/`SecondaryButton` (which wrap `BaseButton`, giving the 44pt target, haptics, loading, and `accessibilityRole="button"` the state tests rely on) rather than re-implementing buttons. A grep for hex/rgb/named-color literals across the five components returns nothing.

### Verification evidence

Per task instructions the suites were not re-run; the commit records `npm run lint` → 0 errors / 5 pre-existing warnings (`View/BuildLists.tsx` ×3, `View/RadioButton.tsx` ×2, unchanged from baseline), `npm test` → 14 suites / 51 tests passing (baseline 9/32 plus the 5 new suites / 19 tests), and `npx tsc --noEmit` clean. The evidence is present and specific; nothing in it raised an articulable doubt warranting a spot-check.

</details>

<details>
<summary>File map</summary>

- `View/Components/SectionCard.tsx` — new inset-grouped container (header/card/footer).
- `View/Components/ListRow.tsx` — new 44pt row with combined a11y label and conditional chevron.
- `View/Components/EmptyState.tsx` — new centered symbol + title + message + optional action button.
- `View/Components/ErrorState.tsx` — new centered error symbol + verbatim message + Retry button.
- `View/Components/SkeletonRow.tsx` — new shimmer placeholder, static under Reduce Motion.
- `View/Components/__tests__/{SectionCard,ListRow,EmptyState,ErrorState,SkeletonRow}.test.tsx` — new suites.
- `jest.setup.js` — added self-contained `react-native-reanimated` mock.

Full diff: `git show e172b37`.

</details>
