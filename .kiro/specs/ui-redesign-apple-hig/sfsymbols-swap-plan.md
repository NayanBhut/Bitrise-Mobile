# Implementation Plan — Swap SF Symbols library to an iOS-13 fork

## Context and decisions (grounded in the repo + registry inspection)

**Problem.** The app must support iOS 13.0. `react-native-nitro-sfsymbols`
(installed at `^2.0.0`, peer `react-native-nitro-modules@^0.37.1`) ships a
podspec with `:ios => "16.0"` that cannot be lowered, so `pod install` fails
with "required a higher minimum deployment target". The orchestrator has
already set `ios/Podfile` to `platform :ios, '13.0'` — leave that as-is.

**Target library (decided).** `react-native-sfsymbols`, the **Mythologi-XR
fork**. Verified against the registry and GitHub during planning:

- The default npm `react-native-sfsymbols` is the **birkir** line (latest
  `1.2.2`, README says "iOS 14+ only"). Its podspec does NOT target iOS 13, so
  installing by plain version is NOT sufficient.
  Source: [registry metadata](https://registry.npmjs.org/react-native-sfsymbols).
- The **Mythologi-XR fork** README says "iOS 13+ only" and its
  `react-native-sfsymbols.podspec` sets `s.platforms = { :ios => "13.0", :tvos => "10.0" }`
  and `s.dependency "React-Core"` only — no Nitro, no New-Architecture
  requirement. Source:
  [fork podspec](https://raw.githubusercontent.com/Mythologi-XR/react-native-sfsymbols/main/react-native-sfsymbols.podspec).
- **Decision:** install from the git fork `github:Mythologi-XR/react-native-sfsymbols`
  (optionally pin to a commit) so the iOS-13 podspec is used. Do NOT rely on the
  plain npm version. Record in the report which source resolved.
  Content was rephrased for compliance with licensing restrictions.

**New component API (decided, from the fork's `src/index.tsx`).** The export is
a class `SFSymbol extends PureComponent` (NOT a host component, NOT forwardRef),
imported as `import {SFSymbol} from 'react-native-sfsymbols'`. It renders `null`
when `Platform.OS !== 'ios'`. Props:
`name: SymbolName`, `color?: ColorValue`, `style?: StyleProp<ViewStyle>`,
`size?: number`, `resizeMode?: SymbolResizeMode`, `weight?: SymbolWeight`
(`'ultralight' | 'light' | 'thin' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy'`),
`scale?: SymbolScale` (`'small' | 'medium' | 'large'`), `multicolor?: boolean`,
`fallback?: SafeSymbolName`. It also re-exports `SFSymbolWeight` and
`SFSymbolScale` enums and the `SymbolName`/`SymbolWeight`/`SymbolScale` types.
Source:
[fork src/index.tsx](https://raw.githubusercontent.com/Mythologi-XR/react-native-sfsymbols/main/src/index.tsx).

**Behavior tradeoff (decided, must be documented in code + docs).** The iOS-13
fork has NO native symbol effects (bounce/pulse/variableColor) and NO
hierarchical/palette rendering modes — only monochrome + `multicolor`. So:
- `AppIcon`'s `effect` and `rendering` props stay in the public API for
  source-compatibility but become no-ops on the native symbol.
- The "running build" animation intent is preserved by animating the icon in
  JS with `react-native-reanimated` (already a dependency), gated on
  `useTheme().reduceMotion` (static when Reduce Motion is on). If wiring the JS
  animation into `StatusBadge`'s running state is more than a small change,
  render the running icon statically and leave a clear `TODO` + a finding note
  instead — do not over-engineer.

**Jest default platform.** Under `@react-native/jest-preset`, `Platform.OS`
defaults to `'ios'`, so `SFSymbol` renders its native element in tests and
`findAllByType(SFSymbol)` works the same way `findAllByType(SFSymbolView)` did.

**Scope of test breakage (discovered — wider than the task brief).** FIVE test
files import `{SFSymbolView} from 'react-native-nitro-sfsymbols'` and query by
that type. All must be migrated to `{SFSymbol} from 'react-native-sfsymbols'`:
`AppIcon.test.tsx`, `StatusBadge.test.tsx`, `EmptyState.test.tsx`,
`ErrorState.test.tsx`, `ListRow.test.tsx`. Most only assert `.props.name`
(still valid); `AppIcon`/`StatusBadge` also assert nitro-only props
(`.props.animation`, `.props.tintColor`) that must change.

**Hard constraints (carried through every step).** Do NOT modify `API Calls/`
or `View/APIConstants/APIConstants.tsx`. Do NOT rename files (incl.
`View/BuidDetailView.tsx`) or navigation routes. SF Symbols remain the ONLY iOS
icon source (no PNG/SVG/other icon fonts on iOS). No color literals in
components outside `View/Theme/` (ANSI palette excepted). Do NOT change the
Android branch of `AppIcon`. Do NOT run `pod install` or a native iOS build.

---

## Plan

- [ ] 1. Swap the dependency: remove Nitro packages, install the iOS-13 fork, and confirm its podspec targets iOS 13.0.
      Run `npm uninstall react-native-nitro-sfsymbols react-native-nitro-modules`,
      then install the fork: `npm install github:Mythologi-XR/react-native-sfsymbols`.
      Before/after, run `npm view react-native-sfsymbols versions` and
      `npm view react-native-sfsymbols` to document the registry state; then open
      `node_modules/react-native-sfsymbols/react-native-sfsymbols.podspec` (or the
      `*.podspec` present) and CONFIRM it contains `:ios => "13.0"` and depends
      only on `React-Core`. If the dependency resolved to the birkir/MoOx line
      (iOS 14+ podspec) instead, that is the wrong source — reinstall from
      `github:Mythologi-XR/react-native-sfsymbols` so the iOS-13 podspec is used.
      Pin the result to an exact entry in `package.json` (an exact npm version if
      the fork is ever published, otherwise the exact `github:Mythologi-XR/react-native-sfsymbols#<commit-sha>`
      that `npm` recorded in `package-lock.json`). Note in the report which source
      was used. Confirm `react-native-nitro-sfsymbols` and
      `react-native-nitro-modules` no longer appear in `package.json` or
      `node_modules`.
      Files: `package.json`, `package-lock.json`, `node_modules/react-native-sfsymbols/**` (installed, not committed source).
      Verify: `npm view react-native-sfsymbols` succeeds AND the installed
      `node_modules/react-native-sfsymbols/*.podspec` shows `:ios => "13.0"` with a
      `React-Core` dependency and no Nitro dependency; `npm run lint` still runs
      (it will surface the now-dangling nitro import in `AppIcon.tsx`, fixed in
      step 2). Do NOT run `pod install`.

- [ ] 2. Rewrite only the iOS branch of `AppIcon` to use `<SFSymbol>`, keeping AppIcon's public prop API stable.
      In `View/Components/AppIcon.tsx`: replace the
      `react-native-nitro-sfsymbols` import with
      `import {SFSymbol, SFSymbolWeight, SFSymbolScale} from 'react-native-sfsymbols'`
      (import only the symbols that actually exist in the fork). Keep the exported
      `AppIconProps` shape and names identical: `{ name: IconName, size?, weight?,
      scale?, color?: ColorToken, rendering?, effect?, accessibilityLabel? }`.
      Redefine the exported helper types to the fork's enums/unions since the Nitro
      enums no longer exist:
      `export type AppIconWeight = SFSymbolWeight` (or the `SymbolWeight` string
      union), `export type AppIconScale = SFSymbolScale`, and replace the
      now-nonexistent rendering/effect source types with local string-literal
      unions — e.g. `export type AppIconRendering = 'monochrome' | 'hierarchical' | 'palette' | 'multicolor'`
      and `export type AppIconEffect = 'bounce' | 'pulse' | 'scale' | 'rotate' | 'appear' | 'disappear' | 'replace' | 'variableColor'`
      — so existing callers (`StatusBadge` passes `effect="rotate"`) keep compiling.
      iOS branch mapping onto `<SFSymbol>`:
      - `name` → `mapping.ios` (from `View/Theme/icons.ts`, unchanged). If the
        fork's `SymbolName` union rejects our strings, cast with `as never`/`as
        SymbolName` at the single call site and comment why.
      - `color` → pass as `color` ONLY when `typeof color === 'string'` (hex),
        omit it for a non-string `PlatformColor` `OpaqueColorValue` — identical to
        today's behavior so iOS keeps the dynamic system tint. (Note in a comment
        that the fork's `color` could accept PlatformColor via `processColor`, but
        we intentionally preserve the existing hex-only-forward behavior.)
      - `size` → `size`; `weight` → `weight`; `scale` → `scale` (all pass through;
        the enum string values match: regular/medium/etc.).
      - `effect` and `rendering` → accepted but NOT forwarded to `<SFSymbol>`
        (no-ops on the native symbol). Add a top-of-function comment documenting
        that native effects + hierarchical/palette rendering are unavailable on the
        iOS-13 fork and that running-build motion is handled in JS (see step 2b/
        StatusBadge).
      - `accessibilityLabel` → forward as-is; preserve the current decorative-by-
        default semantics.
      Do NOT touch the Android branch (Material Symbol glyph) at all.
      Files: `View/Components/AppIcon.tsx`
      Verify: `npx tsc --noEmit` has no NEW errors from `AppIcon.tsx`; the
      component tests compile against the new types once step 4 updates them.

- [ ] 2b. Preserve the running-build animation in JS (reanimated), gated on Reduce Motion.
      Decide the minimal home for the animation. Preferred: a small wrapper inside
      `StatusBadge` (the only running-state caller) that wraps the running
      `<AppIcon name="running" />` in an `Animated.View` from
      `react-native-reanimated` driving a gentle continuous rotation (or opacity
      pulse) via `useSharedValue` + `useAnimatedStyle` + `withRepeat`/`withTiming`,
      and renders a STATIC icon (no animated style, cancel any shared value) when
      `useTheme().reduceMotion` is true. Keep the existing `AppIcon`
      `effect="rotate"` prop on the call for source-compatibility (it is now a
      no-op). If wiring this into `StatusBadge` is more than a small, self-contained
      change, instead render the running icon statically, add a clear
      `// TODO: JS-driven running animation` comment, and record it as a finding in
      the report — do not over-engineer.
      Files: `View/Components/StatusBadge.tsx` (and `View/Components/AppIcon.tsx`
      only if a shared animated wrapper is cleaner there).
      Verify: `npm test -- StatusBadge` passes with the step-4 test rewrite;
      manually confirm the reanimated jest mock in `jest.setup.js` already
      no-ops the hooks so the component renders under Node.

- [ ] 3. Replace the Jest native mock: swap the nitro mock for a `react-native-sfsymbols` mock.
      In `jest.setup.js`, remove the entire `jest.mock('react-native-nitro-sfsymbols', ...)`
      block and add a `jest.mock('react-native-sfsymbols', ...)` that returns a
      lightweight component mock plus the enums the code imports. Mock a `SFSymbol`
      as `React.forwardRef((props, ref) => React.createElement(View, {ref, ...props}))`
      with `displayName = 'SFSymbol'` so `findAllByType` and `.props.name`/`.props.color`
      assertions work; also export `SFSymbolWeight` (ultralight/light/thin/regular/
      medium/semibold/bold/heavy — note: NO `black` in the fork) and `SFSymbolScale`
      (small/medium/large). Keep the existing gesture-handler, haptic-feedback, and
      reanimated mocks unchanged. Ensure no remaining reference to
      `react-native-nitro-sfsymbols` exists anywhere.
      Files: `jest.setup.js`
      Verify: `npm test` no longer errors on importing `react-native-nitro-sfsymbols`;
      remaining failures are the assertion mismatches fixed in step 4.

- [ ] 4. Migrate all five component tests from `SFSymbolView`/nitro to `SFSymbol`/the new library.
      Same-pattern edit across five files: change the import from
      `import {SFSymbolView} from 'react-native-nitro-sfsymbols'` to
      `import {SFSymbol} from 'react-native-sfsymbols'` and replace every
      `findAllByType(SFSymbolView)` with `findAllByType(SFSymbol)`. Name-only
      assertions (`.props.name === icons.*.ios`) stay as-is.
      - `View/Components/__tests__/EmptyState.test.tsx`: import + type swap only.
      - `View/Components/__tests__/ErrorState.test.tsx`: import + type swap only.
      - `View/Components/__tests__/ListRow.test.tsx`: import + type swap only.
      - `View/Components/__tests__/AppIcon.test.tsx`: import + type swap; change the
        tint assertions from `.props.tintColor` to `.props.color` (fork prop name);
        REMOVE or rewrite the two `.props.animation` tests ("applies a symbol
        effect" / "omits the effect") since the native symbol no longer takes an
        animation prop — replace with a test that `effect` is accepted without
        forwarding an `animation`/native-effect prop (assert the rendered
        `SFSymbol` has no `animation` prop), and keep the reduce-motion case only if
        it maps to the JS animation decision from step 2b.
      - `View/Components/__tests__/StatusBadge.test.tsx`: import + type swap; the
        "renders icon + text label" cases stay (still assert `.props.name`). Rewrite
        the "animates only the in-progress state" test to match the step-2b
        decision: if JS animation landed, assert the running badge wraps the icon in
        an animated view / applies an animated style while the success badge does
        not; if the static fallback was chosen, assert both render the icon and drop
        the animation assertion (note the change in the report).
      Files: `View/Components/__tests__/EmptyState.test.tsx`,
      `View/Components/__tests__/ErrorState.test.tsx`,
      `View/Components/__tests__/ListRow.test.tsx`,
      `View/Components/__tests__/AppIcon.test.tsx`,
      `View/Components/__tests__/StatusBadge.test.tsx`
      Verify: `npm test` — all suites pass with no skipped tests.

- [ ] 5. Update the docs to record the library switch, the iOS-13 rationale, and the tradeoff.
      In `.kiro/specs/ui-redesign-apple-hig/design.md` (the "Icon library"
      decision table/section and the "Native build note") and in `UI_REDESIGN.md`
      (the "Icon library" decision section and the `pod install` dependency list):
      change the chosen library to `react-native-sfsymbols` (Mythologi-XR iOS-13
      fork); state WHY (hard requirement to support iOS 13.0 — the Nitro library's
      podspec is locked to iOS 16.0 and `pod install` failed); and record the
      tradeoff honestly: the iOS-13 fork does NOT provide native symbol effects
      (bounce/pulse/variableColor) or hierarchical/palette rendering, so the
      running-build animation is now JS-driven with reanimated (or static +
      Reduce-Motion-gated), and `AppIcon`'s `effect`/`rendering` props are retained
      as accepted-but-ignored for source-compatibility. Update the installed-
      dependency lines to drop `react-native-nitro-sfsymbols` /
      `react-native-nitro-modules` and add the fork. Keep it concise. Do NOT edit
      `icons.ts` (mapping unchanged) and do NOT rename anything.
      Files: `.kiro/specs/ui-redesign-apple-hig/design.md`, `UI_REDESIGN.md`
      Verify: re-read both sections; they name the new library, the iOS-13 reason,
      and the effects/rendering tradeoff, with no stale "Nitro / iOS 16" claims in
      the icon sections.

- [ ] 6. Run all three verification gates from the repo root and confirm the podspec floor.
      Run, in order: `npm run lint` (expect 0 errors; the 2 pre-existing
      `RadioButton.tsx` warnings may remain; add NO new warnings),
      `npm test` (all suites pass, no skipped tests), and `npx tsc --noEmit`
      (ZERO errors introduced by these changes — there may be pre-existing
      test-file type errors; fix the ones your changes touch, report any you did
      not; your own changes must not ADD type errors). Then re-confirm via
      `npm view react-native-sfsymbols` and inspection of
      `node_modules/react-native-sfsymbols/*.podspec` that the installed podspec is
      `:ios => "13.0"`. Do NOT run `pod install`.
      Files: none (verification only).
      Verify: all three commands meet the thresholds above and the installed
      podspec shows iOS 13.0; capture the exact outputs in the report.

## Notes / assumptions

- The fork is installed from git, not a published semver, so "pin an exact
  version" means pinning the exact `github:Mythologi-XR/react-native-sfsymbols#<sha>`
  recorded in `package-lock.json`. If the coder finds a published exact version
  that carries the iOS-13 podspec, pin that instead and note it.
- `AppIcon`'s `name` is typed `IconName` and resolved to a plain string via
  `icons[name].ios`; the fork types `name` as a large `SymbolName` union. If TS
  complains, a single localized cast at the `<SFSymbol name=...>` call site is
  acceptable and preferable to loosening `icons.ts`.
- `jest.setup.js`'s existing reanimated mock already no-ops `useSharedValue`,
  `useAnimatedStyle`, `withRepeat`, `withTiming`, etc., so the step-2b JS
  animation renders under Node without extra mocking.
- The `effect`/`rendering` props are deliberately retained (not deleted) to keep
  every current call site compiling without edits — this is the source-
  compatibility requirement, not dead code to remove.
