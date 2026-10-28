# HIG Compliance Review — UI Redesign (Audit Pass)

Branch: `feature/ui-redesign-apple-hig` · Baseline commit: `56012e9` · HEAD: `63ab38c`

This is a **read-only audit**. No production code was changed in this pass. Fixes
happen in the next loop. Recorded verification from Phase 1 (not re-run here):
**lint** 0 errors / 2 pre-existing warnings · **`npm test`** 104/104 across 23
suites · **`npx tsc --noEmit`** 0 errors.

Finding format: *screen/file — issue — severity — principle — fix.*
Contrast ratios are computed from the literal RGB values in the Android palette
(`View/Theme/colors.ts`) and the ANSI palette (`View/ansiPalette.ts`). Thresholds:
**4.5:1** body text, **3:1** large text (≥17pt bold/semibold) and icons. iOS
`PlatformColor` tokens rely on Apple's documented semantic-color contrast
guarantees and are not numerically re-derived.

Items that can only be confirmed on a device/simulator are marked **"requires
device verification — audited statically."** No hardware testing was performed.

---

## 1. Guardrails (any failure = HIGH)

All guardrails **PASS**. No findings.

- `git diff 56012e9 HEAD -- "API Calls/" "View/APIConstants/"` → **empty**. Data
  layer untouched.
- `git diff --name-status 56012e9 HEAD` → only `A`/`M` entries, **no `R`
  (rename) or `D` (delete)**. `View/BuidDetailView.tsx` retains its intentional
  misspelling. Routes in `App.tsx` remain `LoginForm`, `Apps List`, `BuildList`,
  `BuildDetailView`.
- **Security behaviors intact (read in source):**
  - `SecureField.tsx` hard-sets `secureTextEntry`, `autoComplete="off"`,
    `autoCorrect={false}`, `spellCheck={false}`, `importantForAutofill="no"`,
    `textContentType="none"`, `autoCapitalize="none"`, and omits those props
    from its public type so callers cannot override them. Show/hide toggle
    present.
  - `BuildTriggerModal.tsx` secret-wipe effect keyed on `wasVisible` clears
    `data`, `keyName`, `keyValue`, `editingItem`, `branchName`, `workFlowValue`,
    `abortReason`, `revealedKeys` on close — preserved.
  - Env-var rows mask with `MASK` by default and reveal per-row via
    `revealedKeys[item.id]` — preserved. Env value input uses `SecureField`.
  - All API error surfaces route through `getUserFacingError()` (TokenForm,
    AppList, BuildLists, BuidDetailView, BuildTriggerModal). No raw server body
    or stack trace is rendered.
- **Original features present:** keychain auto-login (`TokenForm` `useEffect` →
  `getToken()` → `getAPIData`), pagination `next`-token guards (AppList/
  BuildLists `getAPIData`/`getAppBuilds`), infinite scroll (`onEndReached`),
  trigger payload (`branch`/`workflow_id`/`environments` in `triggerBuid`),
  abort payload + required reason (`abort_reason`/`abort_with_success`/
  `skip_notifications`), full-log fetch from `expiring_raw_log_url`, logout via
  `clearToken()`.

---

## 2. Icons

Overall strong. Every rendered icon goes through `<AppIcon>`; the only `<Image>`
(`AppList.tsx:120`) is a remote **app avatar**, not an icon, and falls back to
the `apps` SF Symbol when absent. No PNG/SVG icon assets, icon fonts, or emoji
used as icons on iOS. All `icons.ts` entries have both an `ios` and `android`
symbol. Running-build animation is JS-driven and gated on `reduceMotion`
(`StatusBadge.RunningIcon`).

**F-1 — `View/Components/AppIcon.tsx` (Android branch) — LOW** — The Android
glyph renders with `fontFamily: 'Material Symbols Outlined'`, but no Material
Symbols font is bundled/linked yet (design.md notes it is "wired in a later
task"). On Android the mapped glyph name would render as fallback text, not an
icon. **Principle:** HIG parity / R7 cross-platform mapping. **Fix:** bundle and
link the Material Symbols Outlined font (or `@react-native-vector-icons`
Material set) and confirm glyph rendering. **Status:** deferred — Android-only,
iOS unaffected, and design explicitly scoped the font to a later task.
*Requires device verification — audited statically.*

---

## 3. Color / theming

Grep of all of `View/` except `View/Theme/` for hex, `rgb(`/`rgba(`, and named
colors surfaced the findings below. iOS uses `PlatformColor` throughout; Android
uses the `useColorScheme()`-driven palette.

**F-2 — `App.tsx` (navigation header, lines 39–43) — HIGH** — The native-stack
`screenOptions` hardcode non-semantic colors: `headerTintColor: 'white'`,
`headerStyle: { backgroundColor: 'tomato' }`, `headerLargeTitleStyle: { color:
'white' }`. These are raw literals outside the theme, do not adapt to light/dark
(they are identical in both appearances), and `tomato` is not an Apple system
color. The large-title headers on Apps List and BuildList therefore render a
fixed orange bar in both modes. **Principle:** R3 (follow system appearance),
R8 (semantic/system colors; accent used sparingly), HIG large-title styling.
**Fix:** drive header colors from the theme — set `headerStyle.backgroundColor`
to `colors.background`/`secondaryBackground`, `headerTintColor` and
`headerLargeTitleStyle.color` to `colors.label` (accent only for header button
tints), applied from a theme-aware wrapper so it updates live. **Status:**
**FIXED.** `MyStack` now calls `useTheme()` and drives `screenOptions` from
theme tokens (`headerTintColor` = accent, `headerStyle.backgroundColor` =
background, `headerLargeTitleStyle`/`headerTitleStyle` = label). The header
color props accept plain color strings, so an `asStringColor()` helper narrows
each token: on Android the hex literals drive the header and follow the active
light/dark palette; on iOS the tokens are `PlatformColor` objects, so they
narrow to `undefined` and the native-stack header falls back to iOS's own
system-semantic chrome (adaptive background, label title, systemBlue tint) —
HIG-correct and appearance-adaptive in both modes. The fixed `tomato`/`white`
literals are gone. (`App.tsx` is not a guardrail file — safe to edit.)

**F-3 — `View/RadioButton.tsx` (lines 11, 12, 27) — LOW** — Hardcoded
`backgroundColor: 'blue'` / `'white'` and `color: 'red'`. The file is **dead
code** — `grep` finds no importer anywhere in `View/`, `App.tsx`, or elsewhere.
It is a pre-existing component untouched by this redesign. **Principle:** R3/
R4 (no color literals in components). **Fix:** delete the unused file, or if a
future use is intended, migrate it to theme tokens. **Status:** deferred —
unreferenced dead code, no user-visible impact; pre-existing and out of the
redesign's active surface.

**F-4 — `View/AnsiText.tsx` (line 51) — LOW** — ANSI **background** color is
applied raw: `backgroundColor: \`rgb(${entry.bg})\``. Foreground is fully themed
via `resolveAnsiFg`/the tuned palette, but a log line that sets an ANSI
background passes anser's raw triple straight through, un-themed and not
contrast-checked against the themed foreground. **Principle:** R8 (AA contrast
in both modes). **Fix:** map `entry.bg` through a tuned light/dark background
palette (mirroring the foreground remap) or drop ANSI backgrounds and rely on
the themed surface. **Status:** deferred — only triggers on logs that emit ANSI
background escapes (uncommon); foreground path is already AA-safe. *On-device log
appearance requires device verification — audited statically.*

### Computed contrast ratios

**Android LIGHT** — text tokens on card `#FFFFFF` / grouped `#F2F2F7`:

| token | on #FFFFFF | on #F2F2F7 | verdict |
|---|---|---|---|
| label | 21.00 | 18.82 | pass |
| secondaryLabel | 10.94 | 9.80 | pass |
| tertiaryLabel | 5.23 | 4.69 | pass body |
| accent | 4.02 | 3.60 | **< 4.5 body** (see F-5) |
| statusSuccess | 5.14 | 4.60 | pass body |
| statusFailed / destructive | 6.07 | 5.44 | pass |
| statusInProgress | 7.56 | 6.78 | pass |
| statusOnHold | 4.67 | **4.19** | **< 4.5 on grouped** (see F-6) |
| statusAborted | 5.99 | 5.37 | pass |

**Android DARK** — text tokens on card `#1C1C1E` / `#000000`:

| token | on #1C1C1E | on #000 | verdict |
|---|---|---|---|
| label | 17.01 | 21.00 | pass |
| secondaryLabel | 14.37 | 17.73 | pass |
| tertiaryLabel | 10.10 | 12.47 | pass |
| accent | 4.66 | 5.76 | pass body |
| statusSuccess | 8.42 | 10.39 | pass |
| statusFailed / destructive | 4.99 | 6.16 | pass body |
| statusInProgress | 6.01 | 7.42 | pass |
| statusOnHold | 8.28 | 10.22 | pass |
| statusAborted | 5.93 | 7.31 | pass |

Status-color text is never used alone — `StatusBadge` always pairs color +
symbol + label — so even the marginal `statusOnHold` is backed by text, but the
label text ratio itself still matters for the label's own legibility.

**onFill / button labels** (17pt semibold ⇒ large-text 3:1 threshold):

| combo | ratio | verdict (large 3:1) |
|---|---|---|
| white on accent light `#007AFF` | 4.02 | pass |
| white on accent dark `#0A84FF` | 3.65 | pass |
| white on destructive light `#C50F1F` | 6.07 | pass |
| white on destructive dark `#FF453A` | 3.41 | pass (large) |
| SecondaryButton accent on fill light `#E5E5EA` | 3.20 | pass large / **< 4.5** if ever body |
| SecondaryButton accent on fill dark `#2C2C2E` | 3.82 | pass large |

Button labels qualify as large text (17pt/`fontWeight 600`), so these meet the
3:1 bar. No finding for the buttons themselves.

**F-5 — `View/TokenForm.tsx` "where to create a token" hint (hintStyle) —
MEDIUM** — The hint is `type.footnote` (13pt, body-size, **not** large) colored
`colors.accent`. On Android light, accent `#007AFF` = **4.02** on `#FFFFFF` and
**3.60** on grouped `#F2F2F7` — below the 4.5:1 body threshold. **Principle:**
R8 / WCAG AA body contrast. **Fix:** render the hint at a large-text size, or use
a darker accent variant for small text on light surfaces (e.g. a `#0A5BCC`-class
link color) in the Android light palette, keeping iOS `PlatformColor('link')`/
`systemBlue`. **Status:** **FIXED.** Added a dedicated `link` semantic token to
`ThemeColors`: iOS `PlatformColor('link')`, Android light `#0040DD` (7.56 on
`#FFFFFF`, 6.78 on grouped `#F2F2F7` — clears AA body), Android dark `#0A84FF`
(matches accent, already AA). `TokenForm`'s `hintStyle` now uses `colors.link`
instead of `colors.accent`. The hint stays blue/link-colored but is now
AA-readable at footnote size. *Live light/dark appearance requires device
verification — audited statically.*

**F-6 — `View/Theme/colors.ts` `statusOnHold` light `#B25E00` — MEDIUM** — As
subheadline/footnote **label text** (the `StatusBadge` label is 15pt subheadline,
below large) on grouped `#F2F2F7`, the ratio is **4.19 < 4.5**. On white card it
is 4.67 (pass), so the failure is specific to grouped surfaces (section headers /
grouped list backgrounds). **Principle:** R8 / WCAG AA body contrast. **Fix:**
darken the Android light `statusOnHold` to ≥4.5 on `#F2F2F7` (e.g. `#9A5200` or
darker). iOS `systemOrange` relies on Apple's guarantee. **Status:** **FIXED.**
Android light `statusOnHold` darkened `#B25E00` → `#9A5200` (5.86 on `#FFFFFF`,
5.26 on grouped `#F2F2F7` — clears AA body). iOS `systemOrange` unchanged. A
regression test in `useTheme.test.tsx` asserts ≥4.5 on `#F2F2F7`.
*Requires device verification — audited statically.*

**F-7 — `View/ansiPalette.ts` light palette — MEDIUM** — On the light log
surface `#F2F2F7`, several ANSI colors used as **log body text** (`type.footnote`
mono, 13pt) fall below 4.5:1: `bright-yellow` `#9C7A00` = **3.62**,
`bright-green` `#2E8B3D` = **3.86**, `bright-red` `#D63D2C` = **4.12**,
`yellow` `#8A6D00` = **4.41**, `bright-cyan` `#117A8B` = **4.50** (borderline).
All dark-mode ANSI values pass (lowest `black` = 5.22 on `#1C1C1E`). **Principle:**
R8 / WCAG AA; design.md explicitly promises "every color stays AA-readable."
**Fix:** darken the five light-mode entries above to ≥4.5 on `#F2F2F7`.
**Status:** **FIXED.** Darkened the five light-mode ANSI entries so each clears
AA on `#F2F2F7`: `bright-yellow` `#9C7A00`→`#7A5E00` (5.49), `bright-green`
`#2E8B3D`→`#277030` (5.46), `bright-red` `#D63D2C`→`#C0290F` (5.28), `yellow`
`#8A6D00`→`#7A5E00` (5.49), `bright-cyan` `#117A8B`→`#0E6C7A` (5.46). A new
regression test in `ansiPalette.test.ts` asserts every light-mode ANSI color is
≥4.5:1 on `#F2F2F7`. Dark palette unchanged (already AA). *On-device log
rendering requires device verification — audited statically.*

Status is never communicated by color alone (F verified: `StatusBadge` =
symbol + label always). Accent is used only for interactive/primary elements
(buttons, header action tints, the sign-in hint). `systemRed`/`destructive` is
used only for failures and destructive actions (abort/log-out buttons, error
glyph).

---

## 4. Typography / layout

Apple text styles from `typography.ts` are used across screens; mono token
(`Menlo`/`monospace`) is applied to logs (`BuidDetailView` log text), build
numbers (`BuildHeader`, summary card), and branch names (`BuildBranch`, summary
card). No raw `fontSize` ad-hoc values in screens except the two below.

**F-8 — `View/Components/BaseButton.tsx` (`styles.label`, lines ~120) —
LOW** — The button label uses ad-hoc `fontSize: 17, fontWeight: '600'` instead
of a `typography.ts` token (`headline` is 17/600). **Principle:** R5 (Apple text
styles, not ad-hoc fontSize). **Fix:** spread `type.headline` onto the label.
**Status:** deferred — values already match `headline` exactly, so there is no
visual or Dynamic Type regression; purely a consistency cleanup.

**F-9 — `View/Components/StatusBadge.tsx` / `BuildListViews/*` icon sizes —
LOW** — Status/branch/workflow icons use fixed point sizes (14–16) that do not
scale with Dynamic Type, while their adjacent text does. At the largest
accessibility sizes the glyphs look undersized next to the text. **Principle:**
R5 (Dynamic Type) / R7 (weight/scale matched to adjacent text). **Fix:** derive
icon size from the companion text style or scale via
`PixelRatio.getFontScale()`. **Status:** deferred — icons remain legible and are
always paired with scaling text labels; cosmetic at large sizes.
*Requires device verification — audited statically.*

**F-10 — iPad `maxContentWidth` not applied on list screens — MEDIUM** —
`spacing.maxContentWidth` (700) is applied in `SectionCard`, `EmptyState`, and
`ErrorState`, but the **list content** on `AppList` (SectionList) and
`BuildLists` (FlatList) is not width-constrained, and `BuidDetailView`'s log
container stretches full width. On iPad the rows/log run edge-to-edge instead of
a readable column. **Principle:** R6 (readable max content width on iPad).
**Fix:** constrain list `contentContainerStyle`/`columnWrapper` (or center a
`maxWidth: maxContentWidth` wrapper) on the three screens. **Status:** **FIXED.**
`AppList`'s `SectionList` and `BuildLists`'s `FlatList` now set
`contentContainerStyle={{width:'100%', maxWidth: spacing.maxContentWidth,
alignSelf:'center'}}`, and `BuidDetailView`'s content column is wrapped at
`maxWidth: spacing.maxContentWidth` centered (the log `FlatList` lives inside
it). On iPad rows and logs now render in a readable, centered column instead of
edge-to-edge. *Requires device verification (iPad) — audited statically.*

No fixed heights that clip were found: rows use `minHeight` (not fixed
`height`), and text uses `allowFontScaling`. Touch targets: buttons, header
actions, secure/reveal toggles, and the jump-to-bottom button all set
`minHeight/minWidth: 44` or `hitSlop`. No sub-44 interactive target found.
Safe-area handling present (`SafeAreaProvider` in `App.tsx`; `SafeAreaView` with
`edges={['bottom']}` on list screens; `KeyboardAvoidingView` on TokenForm).

---

## 5. HIG per screen

- **Apps List / BuildList large titles:** `App.tsx` sets `headerLargeTitle:
  true` on both — present. (Header color now theme-driven — **F-2** FIXED.)
- **Chevrons only on navigating rows:** `AppListRow` and `ListRow` show the
  chevron only when pressable/navigating — correct.
- **Abort via swipe + context menu:** `BuildItem` provides a right-swipe action
  (`ReanimatedSwipeable` → `renderRightActions`) and an `onLongPress` for
  running builds, both funneling to the destructive reason sheet — present. See
  F-11 on the "context menu" fidelity.
- **Trigger modal sheet:** `BuildTriggerModal` renders a bottom sheet with a grab
  handle, Cancel (left) / Start Build (right), and `PrimaryButton` disabled
  until `branchName` + `workFlowValue` are non-empty (`isTriggerValid`) —
  correct. See F-12 on detents.
- **Abort & Log Out destructive confirm:** Log Out uses `Alert` with
  `style: 'destructive'` (AppList `confirmLogOut`); Abort uses the
  `DestructiveButton` reason sheet + warning haptic — correct.
- **Four states per network screen:** AppList, BuildLists, and BuidDetailView
  each render loading-skeleton (or spinner) + content + empty + error-with-retry
  — present.
- **Haptics:** light impact on button press (`BaseButton`), success notification
  on trigger, warning on abort — only on intended actions; none on scroll —
  correct.

**F-11 — `View/BuildListViews/BuildItem.tsx` abort affordance — LOW** — The
"context menu" is implemented as a plain `onLongPress` handler, not an iOS
context menu (no `ContextMenu`/`UIMenu` preview). Functionally equivalent and
discoverable, but not the native menu HIG describes. **Principle:** R10
(BuildList "context menu"). **Fix:** adopt a context-menu library
(`react-native-ios-context-menu` or a menu action) for the native preview;
otherwise document the long-press as the accepted fallback. **Status:**
deferred — swipe + long-press already deliver the abort action; native menu is
polish and adds a native dependency. *Requires device verification — audited
statically.*

**F-12 — `View/BuildTriggerModal/BuildTriggerModal.tsx` sheet detents —
LOW** — The sheet is a custom `Modal` with a manual grab handle and
`maxHeight: height * 0.9`, not the native-stack `formSheet` presentation with
medium/large detents the design calls for. design.md explicitly allows the
full-modal fallback "where detents are unavailable," so this is within approved
tradeoffs. **Principle:** R10 / R11 (native sheet detents). **Fix (optional):**
present via a native-stack modal screen with `sheetAllowedDetents` on iOS.
**Status:** deferred — approved fallback; the grab handle + 90%-height sheet
reads as a sheet. *Requires device verification — audited statically.*

---

## 6. Accessibility

Strong overall. Icon-only controls (log out, trigger, load-full-log, abort,
jump-to-bottom, reveal/edit/remove env rows, secure-field toggle) all set
`accessibilityRole="button"` + `accessibilityLabel` (+ `accessibilityHint` where
useful). Build rows read as one combined element: `BuildItem.combinedLabel` =
`"Build {n}, {status}, branch {branch}, {relative}"` with `accessible` on the
`Pressable`. `reduceMotion` gates the skeleton shimmer, the running-icon
rotation, and the jump-to-bottom fade. No blur/transparency material is used —
`BuildTriggerModal` documents a solid scrim and reads
`isReduceTransparencyEnabled` (so Reduce Transparency is **N/A — no blur**). Log
`Text` is `selectable` and is **not** hidden from screen readers.

**F-13 — `View/Components/AppIcon.tsx` decorative-icon hiding on iOS — LOW** —
Decorative icons wrap in a `View` with `accessibilityElementsHidden={!hasLabel}`
and `importantForAccessibility='no-hide-descendants'`. `accessibilityElementsHidden`
and `importantForAccessibility` are the correct iOS/Android props respectively,
but VoiceOver element suppression on iOS is best confirmed live. **Principle:**
R12 (logical focus order; decorative icons hidden). **Fix:** none expected;
verify on device that decorative glyphs are skipped by VoiceOver. **Status:**
deferred — correct props are set. *Requires device (VoiceOver/TalkBack)
verification — audited statically.*

**F-14 — `View/Components/StatusBadge.tsx` nested accessibility label —
LOW** — The badge `View` sets `accessibilityLabel={descriptor.label}` but is not
marked `accessible`, so on some platforms the inner icon/text may still be
focusable separately rather than as one element. Inside `BuildHeader`/build rows
this is absorbed by the row's `accessible` wrapper, but in the detail summary
card the badge stands alone. **Principle:** R12 (combined elements / focus
order). **Fix:** add `accessible` to the badge container (and keep the label).
**Status:** deferred — in the one standalone spot (summary card) it still speaks
the status label; low impact. *Requires device verification — audited
statically.*

---

## 7. Performance / polish

**F-15 — `View/BuidDetailView.tsx` full-log render (lines ~300–315) —
HIGH** — The entire log is rendered by mapping every chunk to an `<AnsiText>`
inside a plain `<ScrollView>`: `logChunks.map((line, index) => <AnsiText ... />)`.
`getLogs` splits the full raw log on `\n` into one chunk per line, so a large
build log becomes thousands of non-virtualized `<Text>` trees, each re-parsed by
`Anser.ansiToJson`. On "Load Full Log" for a big build this will freeze/ANR the
UI thread and can exhaust memory. **Principle:** R9/R10 (responsive log view),
general performance. **Fix:** virtualize with a `FlatList`/`<VirtualizedList>`
keyed per line with a stable `keyExtractor` and a memoized row, or chunk/windowed
render (render-in-batches) so only visible lines mount; memoize per-line ANSI
parsing. This is a self-contained screen change (no guardrail files) and
low-risk. **Status:** **FIXED.** The log now renders through a virtualized
`FlatList<LogLine>` (replacing the `ScrollView` + `.map()`): rows are a memoized
`LogRow` (`React.memo`) wrapping `AnsiText`, keyed by a stable `id`
(`index-contentLength`, folding in **F-16**), with
`initialNumToRender`/`maxToRenderPerBatch` = 40, `windowSize` = 11, and
`removeClippedSubviews`. Only visible lines mount, and `AnsiText` already
memoizes its per-line `Anser.ansiToJson` parse, so large logs no longer mount
thousands of `<Text>` trees or re-parse on unrelated re-renders. Auto-scroll
(`onContentSizeChange → scrollToEnd`), the `onScroll` at-bottom tracking, and
the jump-to-bottom button were re-wired to the `FlatList` ref and preserved.
*On-device scroll smoothness requires device verification — audited statically.*

**F-16 — `View/BuidDetailView.tsx` log keys use array index — LOW** — Lines use
`key={\`k-${index}\`}`. Combined with F-15's fix, switch to a stable key.
**Principle:** list reconciliation stability. **Fix:** derive a stable key (line
content hash + index) when virtualizing. **Status:** **FIXED** as part of F-15 —
the virtualized `FlatList` keys each line by a stable `id` of
`index-contentLength` via `keyExtractor`, replacing the former `k-${index}`.

**F-17 — `View/AppList.tsx` `keyExtractor` index fallback (line 457) — LOW** —
`(item, index) => item.slug ?? index.toString()`. Apps nearly always have a
`slug`, but the index fallback can cause row-identity churn if a slug is ever
missing. **Principle:** stable list keys. **Fix:** fall back to a stable field
(e.g. `title`+`owner.name`) instead of index. **Status:** deferred — slug is
effectively always present; negligible impact. `BuildLists` already uses
`item.slug` with no fallback (good).

**F-18 — `View/BuildListViews/BuildItem.tsx` not memoized — LOW** — `BuildItem`
is a module-scope component (good — no unstable-nested-component), but it is not
wrapped in `React.memo`, so every parent re-render (e.g. footer spinner toggle,
refresh state) re-renders all mounted rows. No `getItemLayout` is provided
(row height varies with Dynamic Type, so `getItemLayout` is not safely
applicable). **Principle:** list performance. **Fix:** wrap `BuildItem` in
`React.memo` keyed on `build.slug`/`status_text`/`finished_at`. **Status:**
deferred — FlatList already windows rows; measurable only on very long lists.

---

## Summary table (all findings)

| ID | File | Area | Severity | Status |
|----|------|------|----------|--------|
| F-1 | View/Components/AppIcon.tsx (Android) | Icons | Low | deferred — Android font is a later-task item; iOS unaffected |
| F-2 | App.tsx (header colors) | Color/theming | **High** | **FIXED** — header driven from theme; iOS uses native semantic chrome |
| F-3 | View/RadioButton.tsx | Color/theming | Low | deferred — unreferenced dead code |
| F-4 | View/AnsiText.tsx (ANSI bg) | Color/theming | Low | deferred — rare ANSI-bg path; fg already AA |
| F-5 | View/TokenForm.tsx (hint) | Color/contrast | Medium | **FIXED** — new AA-safe `link` token (`#0040DD` Android light) |
| F-6 | View/Theme/colors.ts statusOnHold (light) | Color/contrast | Medium | **FIXED** — `#B25E00`→`#9A5200` (5.26 on grouped) |
| F-7 | View/ansiPalette.ts (light) | Color/contrast | Medium | **FIXED** — 5 light ANSI entries darkened to ≥4.5 on `#F2F2F7` |
| F-8 | View/Components/BaseButton.tsx (label) | Typography | Low | deferred — values already equal `headline` |
| F-9 | StatusBadge / BuildListViews icon sizes | Typography | Low | deferred — cosmetic at largest Dynamic Type |
| F-10 | AppList / BuildLists / BuidDetailView iPad width | Layout | Medium | **FIXED** — content constrained to `maxContentWidth`, centered |
| F-11 | View/BuildListViews/BuildItem.tsx (context menu) | HIG | Low | deferred — swipe+long-press already work |
| F-12 | View/BuildTriggerModal/BuildTriggerModal.tsx (detents) | HIG | Low | deferred — approved fallback |
| F-13 | View/Components/AppIcon.tsx (VO hiding) | A11y | Low | deferred — correct props set; device-verify |
| F-14 | View/Components/StatusBadge.tsx (accessible) | A11y | Low | deferred — low impact; speaks label |
| F-15 | View/BuidDetailView.tsx (full-log render) | Performance | **High** | **FIXED** — virtualized `FlatList` + memoized rows |
| F-16 | View/BuidDetailView.tsx (index keys) | Performance | Low | **FIXED** with F-15 — stable `index-contentLength` key |
| F-17 | View/AppList.tsx (keyExtractor index) | Performance | Low | deferred — slug effectively always present |
| F-18 | View/BuildListViews/BuildItem.tsx (memo) | Performance | Low | deferred — FlatList already windows |

**Counts:** High = 2 (F-2, F-15) · Medium = 4 (F-5, F-6, F-7, F-10) · Low = 12.
To-fix = 6 (all High + Medium). Deferred = 11 (all remaining Low). **No findings
are BLOCKED** — every to-fix lived in an editable, non-guardrail file
(`App.tsx`, `View/Theme/colors.ts`, `View/ansiPalette.ts`, `View/TokenForm.tsx`,
and the three screen files), and none required a file or route rename.

### Fix pass (this iteration)

All 6 to-fix findings are now **FIXED**: **F-2** (header colors), **F-5**
(TokenForm hint via new `link` token), **F-6** (`statusOnHold` light), **F-7**
(light ANSI palette), **F-10** (iPad readable width on the three screens), and
**F-15** (virtualized full-log render). **F-16** was fixed as a byproduct of
F-15 (stable log keys). The remaining 11 Low findings stay **deferred** with
the reasons recorded in each entry; nothing is BLOCKED.

Changed files: `App.tsx`, `View/TokenForm.tsx`, `View/Theme/colors.ts`,
`View/ansiPalette.ts`, `View/AppList.tsx`, `View/BuildLists.tsx`,
`View/BuidDetailView.tsx`, plus regression tests in
`View/Theme/__tests__/useTheme.test.tsx` and `View/__tests__/ansiPalette.test.ts`.

Guardrails re-verified: `git diff 56012e9 HEAD -- "API Calls/"
"View/APIConstants/"` stays empty; no file or route renames/deletes;
`BuidDetailView.tsx` keeps its intentional misspelling; SF Symbols remain the
only iOS icon source; no color literals added outside `View/Theme/` (the `link`
literals live in `colors.ts`, the ANSI literals in `ansiPalette.ts`); all
security/behavior (keychain auto-login, pagination, trigger/abort payloads,
full-log fetch, masked secrets, modal secret-wipe, `getUserFacingError()`-only
messages) preserved.

Gate results (run from repo root): `npm run lint` → **0 errors**, 2
pre-existing RadioButton warnings (no new warnings); `npx jest --ci` →
**107/107 passing, 23 suites, 0 skipped** (was 104; +3 contrast/token regression
tests); `npx tsc --noEmit` → **0 errors**.

---

## Device-only items still needing a manual pass

Audited statically above; these require hardware and could not be executed:

- Live VoiceOver / TalkBack focus order and decorative-icon suppression
  (F-13, F-14).
- Real-time light/dark appearance switching and the header color fix (F-2, F-5).
- On-device contrast of status/ANSI colors in both modes (F-6, F-7, F-4).
- iPad readable-width layout and large-title collapse behavior (F-10).
- Scroll smoothness / freeze test for the full-log screen before and after the
  F-15 fix.
- Haptic feel on trigger/abort/press.
- Native sheet detent / grab-handle feel (F-12) and swipe-to-abort gesture
  (F-11).
- Building/running the iOS app after `pod install` (SF Symbols native module);
  Android Material Symbols font rendering (F-1).
- Dynamic Type at the largest accessibility sizes across all screens.
