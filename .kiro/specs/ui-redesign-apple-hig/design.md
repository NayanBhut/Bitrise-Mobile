# Design — Full UI Redesign (Apple HIG)

## Overview

This design refactors the presentation layer of BitriseMobile into a themed,
component-driven UI that follows the current Apple Human Interface Guidelines,
while leaving the data layer (`API Calls/`, `APIConstants.tsx`) and all routes
untouched. The strategy is: build a theme + shared component library first, then
refactor each screen to consume them.

## Dependency decisions

### Icon library: `react-native-sfsymbols` (iOS-13 fork, chosen)

Candidates considered:

| Library | Status | Fit |
|---------|--------|-----|
| `expo-symbols` | Maintained | Requires bootstrapping Expo Modules core into a bare project — heavier native change, more risk for a UI-only task. |
| `react-native-nitro-sfsymbols` | Maintained | Nitro-based, feature-rich (all rendering modes + iOS 17 symbol effects) BUT its podspec is locked to `:ios => "16.0"` and cannot be lowered, and it is tied to the Nitro / New-Architecture stack. `pod install` failed with "required a higher minimum deployment target". |
| **`@mythologi/react-native-sfsymbols@2.2.1`** | **Chosen** | Podspec sets `:ios => "13.0"` and depends only on `React-Core` (no Nitro, no New-Architecture requirement), so it runs fine at the app's 15.1 floor. Keeps "SF Symbols only on iOS". |

Minimum iOS deployment target: **iOS 15.1**. This is forced by React Native
0.88 itself — its Fabric / ReactCommon / Yoga / Hermes pods hard-require iOS
15.1, so `pod install` fails at any lower floor. iOS 13 was therefore not
achievable without downgrading React Native, which was not done. The Podfile
keeps the floor at RN's own minimum via `platform :ios, min_ios_version_supported`
(resolves to 15.1 on RN 0.88); the Xcode project's
`IPHONEOS_DEPLOYMENT_TARGET` is 15.1 across all configurations.

The SF Symbols library still had to change because the original
`react-native-nitro-sfsymbols` targets iOS 16.0 with an unchangeable podspec
floor and is Nitro-bound. The chosen library is
`@mythologi/react-native-sfsymbols@2.2.1`, installed from npm, whose podspec
targets iOS 13.0 and depends only on `React-Core`. It was adopted (rather than
simply raising the floor and keeping Nitro) to stay off the iOS-16-locked /
New-Architecture-bound Nitro library. The pod it vendors is named
`react-native-sfsymbols`, matching autolinking.

Tradeoff (accepted): the iOS-13 fork renders monochrome symbols (plus
`multicolor`) and does **not** provide hierarchical/palette rendering modes or
native symbol effects (bounce/pulse/variableColor). Consequences:

- `AppIcon`'s `effect` and `rendering` props are retained in the public API for
  source-compatibility but are no-ops on the native symbol.
- The "running build" animation is now **JS-driven** with
  `react-native-reanimated` (a gentle continuous rotation in `StatusBadge`),
  gated on Reduce Motion so it renders static when Reduce Motion is on.

Installed: `@mythologi/react-native-sfsymbols@2.2.1` from npm (iOS-13 podspec).
The former Nitro packages (`react-native-nitro-sfsymbols`,
`react-native-nitro-modules`) were removed.

### Haptics: `react-native-haptic-feedback@^3.0.0`

The task's named option. Auto-linked (RN 0.71+), iOS Core Haptics with an
Android vibration fallback, and a no-op where unsupported.

### Animations

`react-native-reanimated@4.7.1` and `react-native-worklets@0.13.0` are already
present and used for small, purposeful animations (skeleton shimmer, jump-to-
bottom button). All custom animation is gated behind a Reduce Motion check.

### Native build note

The SF Symbols module is native. A `cd ios && bundle exec pod install` (via the
project's bundler setup) is required before the next iOS build. With the Podfile
at `platform :ios, min_ios_version_supported` (iOS 15.1 on RN 0.88) and the
`@mythologi/react-native-sfsymbols` iOS-13 podspec, pod resolution succeeds
(97 dependencies, 96 pods installed).

## Architecture

```
View/
  Theme/
    colors.ts        # PlatformColor (iOS) + useColorScheme palette (Android)
    typography.ts     # Apple text styles → RN text style objects
    spacing.ts        # 8pt grid tokens, radii, hitSlop, maxContentWidth
    icons.ts          # name → { ios: SFSymbol, android: MaterialSymbol } map
    useTheme.ts       # hook returning { colors, type, spacing, scheme, reduceMotion }
  Components/
    AppIcon.tsx       # SF Symbol (iOS) / Material Symbol (Android) wrapper
    StatusBadge.tsx   # color + symbol + text label for build status
    ListRow.tsx       # inset grouped row (leading icon, title, subtitle, chevron/accessory)
    SectionCard.tsx   # grouped container with header
    PrimaryButton.tsx
    SecondaryButton.tsx
    DestructiveButton.tsx
    SecureField.tsx   # masked field + eye toggle + secure defaults
    EmptyState.tsx    # symbol + title + message (+ optional action)
    ErrorState.tsx    # symbol + sanitized message + Retry
    SkeletonRow.tsx   # shimmer placeholder row
  (screens refactored in place: TokenForm, AppList, BuildLists,
   BuidDetailView, BuildTriggerModal, AnsiText, BuildListViews/*)
```

Data flow and props from the existing screens are preserved. Only the rendering
and local UI state (search text, refreshing, reveal toggles, scroll position for
jump-to-bottom) change.

## Theme design

### colors.ts

Exposes a `ThemeColors` interface with semantic tokens:
`background`, `secondaryBackground`, `groupedBackground`,
`secondaryGroupedBackground`, `label`, `secondaryLabel`, `tertiaryLabel`,
`separator`, `fill`, `accent`, and status tokens `statusSuccess`,
`statusFailed`, `statusInProgress`, `statusOnHold`, `statusAborted`,
`destructive`.

- **iOS:** each token is a `PlatformColor('systemBackground')` etc., so light/
  dark, Increase Contrast, and future OS changes resolve automatically. Status
  tokens map to `systemGreen/systemRed/systemBlue(or systemIndigo)/systemOrange/
  systemGray`.
- **Android:** a dictionary keyed by `useColorScheme()` ('light' | 'dark')
  providing hand-tuned equivalents that meet WCAG AA. Accent = a systemBlue-
  equivalent (#0A84FF dark / #007AFF light).

No component may use a raw color literal; a lint note documents this.

### typography.ts

Maps Apple text styles → `{ fontSize, lineHeight, fontWeight }` objects built on
the system font (`System` on iOS; default on Android), with
`allowFontScaling` on by default for Dynamic Type. A `mono` family token
(`Menlo` iOS / `monospace` Android) is used for logs, build numbers, commit
hashes, and branch names. Styles: largeTitle, title2, headline, body, callout,
subheadline, footnote, caption.

### spacing.ts

8pt grid (`xs:4, sm:8, md:16, lg:24, xl:32`), corner radii, a shared `hitSlop`
and `minTouchTarget (44)`, and `maxContentWidth` (~700) for iPad readability.

### icons.ts (mapping table)

Single source of truth mapping semantic names to platform symbols:

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

Android Material Symbols are rendered with a Material Symbols icon font
(`@react-native-vector-icons/material-design-icons` or the Material Symbols
font). The exact Android icon font package is finalized in the AppIcon task; it
does not affect iOS, which uses SF Symbols exclusively.

### useTheme.ts

Returns `{ colors, type, spacing, scheme, reduceMotion, boldText }`, subscribing
to `useColorScheme()` and `AccessibilityInfo` (reduce motion, bold text) so the
UI updates live.

## Component design highlights

- **AppIcon:** `{ name, size?, weight?, scale?, color?, rendering?, effect? }`.
  iOS → `SFSymbolView` with weight/scale matched to adjacent text, hierarchical/
  palette for status, effects only when `reduceMotion` is false. Android →
  Material Symbol glyph. Decorative by default; `accessibilityLabel` promotes it.
- **StatusBadge:** takes a `BuildState`, renders color + AppIcon + text label
  (never color alone). Running state uses the `running` symbol with a pulse/
  rotate effect gated on Reduce Motion.
- **SecureField:** wraps TextInput with `secureTextEntry` toggle (eye/eye.slash),
  and forces `autoComplete="off"`, `autoCorrect={false}`, `spellCheck={false}`,
  `importantForAutofill="no"`, `textContentType="none"`. This centralizes the
  security requirement so no screen can accidentally drop it.
- **EmptyState / ErrorState:** symbol + copy; ErrorState shows only the string
  passed in (always `getUserFacingError()` output) and a Retry button.
- **SkeletonRow:** Reanimated shimmer, static opacity under Reduce Motion.

## Screen designs

### LoginForm (`View/TokenForm.tsx`)
Centered welcome: `appGlyph` (hammer.circle.fill) in accent, largeTitle title,
footnote PAT explanation, a `SectionCard` with a `SecureField`, a
`PrimaryButton` "Sign In" with in-button spinner, a subtle link-style hint, and
inline error text under the field (replacing the current `Alert`). Keyboard
avoiding view keeps the button visible. Auto-login behavior unchanged.

### Apps List (`View/AppList.tsx`)
Native large title "Apps" (collapses on scroll via native-stack header).
Inset-grouped `SectionList` by owner. Each row = `ListRow` with avatar (or `apps`
symbol fallback), title, project type subtitle, chevron. Adds pull-to-refresh,
a header search field filtering loaded apps locally, `SkeletonRow`s while
loading, `EmptyState`, and `ErrorState` with Retry. Log Out moves to a header
menu/toolbar button with a destructive confirmation (Alert with destructive
style) calling the unchanged `clearToken()`.

### BuildList (`View/BuildLists.tsx` + `BuildListViews/`)
Large title = app name. Each build = inset card row: `StatusBadge`, build number
(mono), branch with branch symbol (mono), workflow, relative time ("4 min ago"),
duration. Running builds animate the status symbol. Toolbar "Trigger Build"
(play symbol) opens the modal. Abort via swipe action + context menu, each
leading to the destructive reason sheet. Infinite scroll footer spinner,
pull-to-refresh, empty, and error states. BuildHeader/BuildBranch/BuildItem are
rebuilt on the theme and shared components; the relative-time/duration helpers
are UI-only additions.

### BuildDetailView (`View/BuidDetailView.tsx` + `AnsiText.tsx`)
Header summary `SectionCard` (status, number, branch, workflow, started,
duration). Log in a monospaced theme-aware container. `AnsiText` gains a
theme-aware ANSI palette: the 16 ANSI colors map to tuned light/dark values so
every color stays AA-readable (e.g. bright-black never renders as invisible on a
dark background). Auto-scroll to end preserved; a "Jump to bottom" floating
button appears when scrolled up; "Load Full Log" shows progress. Log text is
selectable (`selectable` on Text).

### BuildTriggerModal (`View/BuildTriggerModal/`)
Presented as a native sheet. On iOS this uses the native-stack
`presentation: 'formSheet'` / sheet detents (medium, large) with a grab handle;
where detents are unavailable it falls back to the existing full modal. Grouped
`SectionCard`s: Branch, Workflow ID, Environment Variables. Env rows use masked
values with per-row reveal (existing behavior). Cancel (left) / Start Build
(right); Start Build is a `PrimaryButton` disabled until branch + workflow are
non-empty. The existing secret-wiping effect on close is preserved verbatim.

## Accessibility design
- AppIcon decorative by default; icon-only buttons wrapped with
  accessibilityLabel + accessibilityHint and 44pt hit targets.
- Build rows set `accessible` + a composed `accessibilityLabel`
  ("Build 142, failed, branch main, 4 minutes ago").
- Reduce Motion disables shimmer and symbol effects; Reduce Transparency falls
  back to solid backgrounds; Bold Text honored via system font weights.
- `accessibilityRole` on all buttons/links; logical focus order.

## Testing strategy
- Jest + react-test-renderer (already configured) for shared components:
  AppIcon (platform branch), StatusBadge (color+symbol+label per state),
  SecureField (secure defaults + toggle), EmptyState/ErrorState, SkeletonRow,
  and the theme hook.
- Update `App.test.tsx` and any snapshots impacted by the new UI.
- Mock the native SF Symbols / haptics modules in jest setup so tests run on
  Node.
- `npm run lint` and `npm test` are the gates.

## Risks
- RN 0.88 is very new; native pods must resolve. Mitigation: pods are a
  documented manual/CI step; JS-level tests mock natives.
- Sheet detents vary by platform/OS; a solid-modal fallback is specified.
- SF Symbol names differ slightly across iOS versions; AppIcon accepts arbitrary
  strings and supports `fallbackName`.
