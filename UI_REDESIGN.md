# UI Redesign — Apple HIG

A full presentation-layer redesign of BitriseMobile so it reads like a native,
first-party Apple app that follows the current iOS Human Interface Guidelines,
while leaving the data layer and navigation routes untouched.

## Goal

- A native Apple-HIG feel on iOS: SF Symbols, Apple semantic colors, the system
  type scale with Dynamic Type, native large titles, and a native sheet for the
  trigger flow.
- Full light/dark support that follows the system appearance and updates live.
- Works across iPhone (small through Pro Max) and iPad, with a readable max
  content width on wide screens.
- Clean, consistent Android rendering from the same component set (Material
  Symbols, a hand-tuned palette, system font).

This was a UI-only effort. No business logic, networking, storage, or security
behavior changed. The data layer (`API Calls/`) and `View/APIConstants/APIConstants.tsx`
were not modified, no files were renamed, and the four navigation route names
(`LoginForm`, `Apps List`, `BuildList`, `BuildDetailView`) are unchanged.

## Dependency decisions

### Icon library — `react-native-sfsymbols` (iOS-13 fork, chosen)

The app must support **iOS 13.0**. The previously chosen
`react-native-nitro-sfsymbols` ships a podspec locked to `:ios => "16.0"` that
cannot be lowered, so `pod install` failed with "required a higher minimum
deployment target". SF Symbols as a technology exist on iOS 13+, so iOS 13 is
the correct floor and the library had to change.

Chosen: the **Mythologi-XR fork** of `react-native-sfsymbols`, installed from
git (`github:Mythologi-XR/react-native-sfsymbols`). Its podspec sets
`:ios => "13.0"` and depends only on `React-Core` — no Nitro, no
New-Architecture requirement. It keeps the "SF Symbols only on iOS" guarantee.

Tradeoff (accepted honestly): the iOS-13 fork renders monochrome symbols (plus
`multicolor`) and does **not** support hierarchical/palette rendering modes or
native symbol effects (bounce / pulse / variable color). As a result:

- `AppIcon`'s `effect` and `rendering` props stay in the public API for
  source-compatibility but are no-ops on the native symbol.
- The "running build" animation is now **JS-driven** with
  `react-native-reanimated` (a gentle continuous rotation in `StatusBadge`),
  gated on Reduce Motion (static when Reduce Motion is on).

Installed: `react-native-sfsymbols` from
`github:Mythologi-XR/react-native-sfsymbols`. Removed:
`react-native-nitro-sfsymbols` and its peer `react-native-nitro-modules`.

Rephrased from the design document for brevity.

### Haptics — `react-native-haptic-feedback`

The brief's named option. Auto-linked on RN 0.71+, uses iOS Core Haptics with an
Android vibration fallback, and is a no-op where unsupported. Used for a light
impact on primary actions, a success notification on build trigger, and a warning
notification on abort.

### Navigation — migrated to `@react-navigation/native-stack`

The app previously used the JS `@react-navigation/stack`. That navigator has no
`headerLargeTitle` and cannot present a native sheet, so two HIG goals were out
of reach: the collapsing native large title on the Apps List and BuildList, and
the native sheet (detents + grab handle) feel for the trigger modal. The
navigator was swapped to `@react-navigation/native-stack` (backed by
`react-native-screens`), keeping all four route names and their params unchanged,
and `headerLargeTitle` was enabled on the two list screens.

### Animations

`react-native-reanimated` (already present) drives small, purposeful animations
only — the skeleton shimmer and the jump-to-bottom entrance fade. Every custom
animation is gated behind a Reduce Motion check.

## Theme system (`View/Theme/`)

A centralized theme is the single source of color, type, spacing, and icons. No
component uses a raw color literal; the only permitted literals live in
`colors.ts` (the Android palette) and `ansiPalette.ts` (the ANSI color table).

- **colors.ts** — semantic tokens (`background`, `secondaryBackground`,
  `groupedBackground`, `label`, `secondaryLabel`, `separator`, `fill`, `accent`,
  the five status tokens, `destructive`, `onFill`). On iOS each token is a
  `PlatformColor(...)` Apple semantic color, so light/dark and Increase Contrast
  resolve automatically. On Android a hand-tuned palette is keyed by
  `useColorScheme()` and meets WCAG AA in both modes.
- **typography.ts** — Apple text styles (`largeTitle`, `title2`, `headline`,
  `body`, `callout`, `subheadline`, `footnote`, `caption`) on the system font,
  with Dynamic Type (`allowFontScaling`) on by default, plus a `mono` family
  (Menlo on iOS, monospace on Android) for logs, build numbers, commit hashes,
  and branch names.
- **spacing.ts** — an 8pt grid (`xs 4, sm 8, md 16, lg 24, xl 32`), corner radii,
  a shared `hitSlop`, `minTouchTarget` (44), and `maxContentWidth` (700) for
  iPad readability.
- **icons.ts** — the single name → `{ ios, android }` mapping table.
- **useTheme.ts** — a hook returning `{ colors, type, spacing, scheme,
  reduceMotion, boldText }`, subscribing to `useColorScheme()` and
  `AccessibilityInfo` so the UI updates live.

### Icon mapping table

| name | iOS SF Symbol | Android Material Symbol |
|------|---------------|-------------------------|
| apps | square.stack.3d.up | stacks |
| build | hammer | build |
| success | checkmark.circle.fill | check_circle |
| failed | xmark.octagon.fill | dangerous |
| aborted | stop.circle.fill | stop_circle |
| running | arrow.triangle.2.circlepath | sync |
| onHold | pause.circle.fill | pause_circle |
| branch | arrow.triangle.branch | fork_right |
| workflow | flowchart | account_tree |
| trigger | play.fill | play_arrow |
| abort | stop.fill | stop |
| logs | doc.text.magnifyingglass | plagiarism |
| logout | rectangle.portrait.and.arrow.right | logout |
| token | key.fill | key |
| show | eye | visibility |
| hide | eye.slash | visibility_off |
| envVar | curlybraces | data_object |
| error | exclamationmark.triangle.fill | error |
| empty | tray | inbox |
| appGlyph | hammer.circle.fill | build_circle |
| chevron | chevron.right | chevron_right |

#### Icon tint note (iOS)

`AppIcon.color` accepts any theme `ColorToken`. On iOS a hex string is forwarded
to the SF Symbol's `color` prop directly; a `PlatformColor` `OpaqueColorValue`
(which cannot be expressed as a static hex) is not forwarded, and the symbol
keeps the dynamic system label tint — which already tracks light/dark
automatically. On Android the token is a hex string in
both schemes and is applied to the glyph. This keeps iOS icons system-adaptive
rather than freezing them to a static color.

## Color rationale (psychology-driven, accessible)

- **Accent — systemBlue.** Blue reads as trustworthy and focused, the right tone
  for a developer tool. It is used sparingly, for primary and interactive
  elements only, so it stays meaningful.
- **Status colors.** Success = systemGreen, Failed = systemRed, In progress =
  systemBlue / systemIndigo, On hold = systemOrange, Aborted = systemGray. These
  follow the conventional traffic-light associations users already read quickly.
- **Status is never color-alone.** Every status is communicated as color + SF
  Symbol + text label together (via `StatusBadge`), so the meaning survives color
  blindness and grayscale, satisfying the accessibility rule.
- **Destructive = systemRed.** Abort and Log Out use systemRed and a destructive
  confirmation so irreversible actions look and feel irreversible.
- **WCAG AA.** All text meets AA contrast (4.5:1 body, 3:1 large) in both modes;
  the Android palette was hand-tuned and spot-checked for this, and iOS relies on
  Apple's AA-compliant semantic colors. Pure black/white surfaces are avoided
  except where the iOS system colors provide them.

## Per-screen before / after

### LoginForm (`View/TokenForm.tsx`)

- **Before:** a plain token `TextInput` with a show/hide toggle, a Sign In
  action, and errors surfaced via `Alert`.
- **After:** a centered welcome layout — the `appGlyph` (hammer.circle.fill) in
  the accent color, a large title, a one-line PAT explanation, a `SectionCard`
  wrapping a `SecureField`, a prominent `PrimaryButton` "Sign In" with an
  in-button spinner, a subtle "where to create a token" hint, and inline error
  text under the field (no alerts). A keyboard-avoiding layout keeps the button
  visible.
- **Preserved:** auto-login on mount (`getToken()` → validate → navigate),
  `saveToken()` on success, the exact `ApiService`/`API_CONFIG` call, masking and
  secure-input defaults via `SecureField`, and `getUserFacingError()`-only error
  text.

### Apps List (`View/AppList.tsx`)

- **Before:** a list of apps with an in-screen heading and a Log Out control;
  failures surfaced via `Alert`.
- **After:** a native collapsing large title "Apps", an inset-grouped
  `SectionList` grouped by owner, `ListRow` rows (avatar or `apps` symbol
  fallback + title + project type + chevron), pull-to-refresh, a local search
  filter, skeleton rows while loading, a distinct empty state (no-apps vs
  no-match), an error state with Retry, and Log Out moved to a header menu with a
  destructive confirmation.
- **Preserved:** next-token pagination with its exact guard, `convertToSection`
  owner grouping, the token read, and `clearToken()` on Log Out. Search filters
  loaded sections client-side and never changes what the next page fetches.

### BuildList (`View/BuildLists.tsx` + `BuildListViews/*`)

- **Before:** a list of builds with basic status text and a trigger entry point.
- **After:** a large title (the app name); each build is an inset card showing a
  `StatusBadge` (color + symbol + label), build number (mono), branch with the
  branch symbol (mono), workflow, relative time, and duration. Running builds
  animate the status symbol (Reduce-Motion gated). A toolbar "Trigger Build"
  (play symbol) opens the modal. Abort is available via right-swipe and a
  long-press, each leading to the destructive reason sheet. Infinite-scroll
  footer spinner, pull-to-refresh, and empty/error states round it out. Each row
  reads as one combined accessibility element.
- **Preserved:** pagination guard and concat logic, the trigger payload, and the
  abort payload (`abort_reason`, `abort_with_success`, `skip_notifications`) and
  endpoint.

### BuildDetailView (`View/BuidDetailView.tsx` + `View/AnsiText.tsx`)

- **Before:** a log view rendering ANSI on a hardcoded dark background, with
  `AnsiText` emitting raw `rgb(...)` from the parser (some colors could be
  unreadable on the surface); detail errors surfaced via `Alert`.
- **After:** a `SectionCard` summary (status, number, branch, workflow, started,
  duration), a monospaced theme-aware log surface, a theme-aware ANSI palette
  that keeps all 16 colors AA-readable in both modes, auto-scroll to end, a
  floating "Jump to bottom" button (now with a Reduce-Motion-gated entrance fade;
  static but fully functional when Reduce Motion is on), a header "Load Full Log"
  action with its own progress spinner, and selectable/copyable log text. Detail
  errors render as an `ErrorState` with Retry.
- **Preserved:** both fetch paths verbatim — `getBuildDetails` via `ApiService`
  and `getLogs` via the expiring raw-log `fetch`; only `getUserFacingError()`
  output is shown. The misspelled `BuidDetailView.tsx` filename is kept.

### BuildTriggerModal (`View/BuildTriggerModal/`)

- **Before:** a full-screen modal with plain inputs for branch, workflow, and env
  vars, and hardcoded colors.
- **After:** a sheet-style presentation — bottom-anchored with rounded top
  corners and a grab handle for a native detent feel (with a solid-modal fallback
  and a solid background under Reduce Transparency). Grouped sections (Branch /
  Workflow ID / Environment Variables), env rows with masked values and per-row
  reveal, Cancel (left) / Start Build (right), Start Build disabled until branch
  and workflow are non-empty, and haptics on primary actions.
- **Preserved:** the secret-wiping effect on close (all secret-bearing fields +
  reveal flags), masking-by-default with per-row reveal, the exact trigger
  payload/endpoint/headers, and the exact abort call — all unchanged.

## Shared component library (`View/Components/`)

- **AppIcon** — cross-platform icon wrapper; SF Symbol on iOS, Material Symbol on
  Android, decorative by default, Reduce-Motion-gated effects.
- **StatusBadge** — build status as color + icon + text label (never color
  alone); running state animates, gated on Reduce Motion.
- **ListRow** — inset-grouped row with leading icon, title, subtitle, chevron,
  and a single combined accessibility label.
- **SectionCard** — grouped container with an optional header and footer, width-
  capped for iPad.
- **PrimaryButton / SecondaryButton / DestructiveButton** — themed buttons over a
  shared `BaseButton` (44pt target, loading state, haptic on press).
- **SecureField** — masked field with an eye toggle that hard-sets the secure
  input defaults so callers cannot weaken them.
- **EmptyState** — centered symbol + title + message + optional action.
- **ErrorState** — centered error symbol + the sanitized message (rendered
  verbatim) + a Retry button.
- **SkeletonRow** — shimmer placeholder that renders static under Reduce Motion.

(`BaseButton` is the internal implementation shared by the three button
components.)

## Accessibility

- Icon-only buttons carry `accessibilityLabel` + `accessibilityHint` and 44pt
  targets.
- Build rows read as one element (e.g. "Build 142, failed, branch main, 4 minutes
  ago").
- Reduce Motion disables the shimmer, symbol effects, and the jump-to-bottom
  entrance fade; Reduce Transparency falls back to solid backgrounds; Bold Text
  and Increase Contrast are honored through the system font and semantic colors.

## Quality gates

Run from the repo root:

- `npm run lint` → 0 errors, 2 warnings (both pre-existing in
  `View/RadioButton.tsx`).
- `npm test` → 23 suites / 105 tests passing.

Every shared component has a test, each of the five screens has a mocked render
test (the `API Calls` modules and `global.fetch` are mocked so no network or
keychain runs), and `App.test.tsx` passes under native-stack. There are no
snapshot tests.

## Manual verification pending (task 12 — NOT done)

The following can only be validated on a device or simulator/emulator and are
still outstanding. A native build is required first.

1. **`pod install` (iOS).** Run `cd ios && bundle exec pod install` to link the
   native dependencies: `react-native-sfsymbols` (iOS-13 fork),
   `react-native-haptic-feedback`, `@react-navigation/native-stack`, and
   `react-native-screens`. With the Podfile at `platform :ios, '13.0'` and the
   fork's iOS-13 podspec, resolution is expected to succeed. None of this has
   been run from the current environment.

2. **Device/appearance matrix.** Verify on:
   - iPhone small (e.g. iPhone SE / 13 mini) and iPhone Pro Max,
   - iPad,
   - Android emulator,
   each in **light and dark mode** and at the **largest Dynamic Type size**,
   confirming layouts do not break and contrast holds.

3. **Simulator-only behaviors flagged across the build** that need a live check:
   - Native large-title collapse on Apps List and BuildList as the list scrolls.
   - Trigger sheet detents and grab-handle true drag (vs the restyled-modal
     detent *feel* used as the fallback).
   - Swipe-to-abort feel and the long-press path on running builds.
   - The running-build status-symbol animation (and that it is skipped under
     Reduce Motion).
   - Jump-to-bottom behavior: the scroll-threshold visibility toggle, the
     entrance fade when motion is allowed, and the static render under Reduce
     Motion.
   - ANSI log readability in both light and dark mode, including the near-black
     and near-white entries, on the themed log surface.
   - Haptics: light impact on primary actions, success on trigger, warning on
     abort — and that they no-op cleanly where unsupported.

Until the device matrix above is completed, the redesign is verified at the
JS/TS and unit-test level only.
