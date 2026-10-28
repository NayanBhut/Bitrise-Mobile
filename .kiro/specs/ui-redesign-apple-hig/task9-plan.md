# Task 9 Implementation Plan — BuildTriggerModal refactor (R1, R2, R8, R10, R11, R12)

Redesign `View/BuildTriggerModal/BuildTriggerModal.tsx` into a native-feeling
sheet built on the existing theme + shared components, while preserving the
trigger payload, the abort path, the secret-wiping effect, and env-var
masking-by-default exactly. The BuildList consumer stays untouched.

Branch: `feature/ui-redesign-apple-hig` (work in place, no worktree). Baseline:
`b9a9b32`, `npm run lint` = 0 errors / 2 pre-existing RadioButton.tsx warnings,
`npm test` = 21 suites / 91 passing.

## Scope

- ONLY `View/BuildTriggerModal/BuildTriggerModal.tsx` plus its new test file.
- Do NOT touch `View/BuildLists.tsx`, `API Calls/`, `View/APIConstants/APIConstants.tsx`,
  the theme modules, or any shared component. No file renames, no route changes.

## Key design decisions (made here, grounded in the code I read)

1. **Sheet presentation — option (a): restyled RN `<Modal>` as a bottom sheet.**
   The modal is invoked imperatively through the `visible`/`isAbortVisible`
   props from `BuildLists.tsx` (it renders `<BuildTriggerModal ... />` inline in
   its tree, not as a navigation screen). Converting to a native-stack
   `formSheet` route (option b) would require adding a route, changing how
   BuildList opens it, and reworking the `cancel`/`abortBuild` callback contract
   — all explicitly out of scope and higher risk. So I keep the RN `<Modal>` and
   restyle it to *feel* like a sheet: bottom-anchored container, rounded top
   corners, a grab handle, and a medium/large detent feel via a max-height cap
   (large ≈ 90% of screen) with the content scrolling inside. No new bottom-sheet
   dependency is added. Reanimated is available but not required here; the
   detent feel is achieved with layout + the Modal's built-in `slide` animation,
   gated by Reduce Motion.

2. **Reduce Transparency fallback is trivially satisfied with a solid surface.**
   The current modal already uses a solid card (no blur), so there is nothing to
   fall back *from*. The redesigned sheet uses a solid
   `colors.secondaryGroupedBackground` surface and a solid scrim
   (`colors.background` is a PlatformColor that adapts) — never a blur view. I
   will still detect Reduce Transparency locally via
   `AccessibilityInfo.isReduceTransparencyEnabled()` and keep the surface solid
   unconditionally, documenting that no blur material is introduced. `useTheme`
   does not expose a reduce-transparency flag and expanding it is out of task 9
   scope, so the detection stays local to this component.

3. **Reduce Motion.** Detected via `useTheme().reduceMotion`. When enabled, set
   the `<Modal>` `animationType` to `none` (otherwise `slide`), and do not run
   any custom entrance animation.

4. **Secret inputs route through `SecureField`.** The key-value input and each
   env row's reveal are consolidated onto the existing `SecureField` component
   (which hard-sets `secureTextEntry`, `autoComplete="off"`, `autoCorrect=false`,
   `spellCheck=false`, `importantForAutofill="no"`, `textContentType="none"` and
   provides the labeled eye toggle). This centralizes secure defaults and
   satisfies R2. Per-row reveal of *already-added* env values keeps the existing
   `revealedKeys` map + Show/Hide toggle (now an `AppIcon` show/hide button with
   an accessibilityLabel).

5. **Validation / disabled primary.** `Start Build` is a `PrimaryButton` with
   `disabled={branchName.trim() === '' || workFlowValue.trim() === ''}`. This is
   the minimum validity rule from R10. `BaseButton` already renders
   `accessibilityState.disabled` and dims at 0.4 opacity.

6. **Haptics.** `PrimaryButton`/`DestructiveButton` already fire
   `impactLight` on press via `BaseButton`, which covers "light impact on Start
   Build press". For the two notification haptics not covered by the buttons, the
   component calls `RNHapticFeedback.trigger` directly:
   `notificationSuccess` after a successful trigger response,
   `notificationWarning` when the user confirms an abort. Import style matches
   `BaseButton.tsx`: `import RNHapticFeedback, {HapticFeedbackTypes} from 'react-native-haptic-feedback'`.
   The module is mocked in `jest.setup.js`, so this is a no-op in tests and where
   unsupported.

7. **Callback contract unchanged.** Props stay exactly
   `{ slug, visible, isAbortVisible, abortBuild(abort, reason), cancel(status) }`
   and the exported `CustomKeyModel` interface is kept, so `BuildLists.tsx`
   needs no change.

## Behavior that MUST be preserved verbatim (from reading the current file)

- **Trigger request:** build `objTrigger = { hook_info: {type:'bitrise'},
  build_params: { branch: branchName, workflow_id: workFlowValue, environments:
  data.map(i => ({mapped_to: i.keyName, value: i.keyValue, is_expand: true})) } }`,
  POST via `new ApiService(API_CONFIG.BASE_URL + API_CONFIG.API_VERSION)` to
  `API_CONFIG.endpoints.builds.trigger(props.slug)` with headers
  `{'content-type':'application/json', Authorization: auth}` where
  `auth = await getToken()` (early-return on null). On response, keep the
  `result.status === 'error'` message branch and `props.cancel(true)` on OK. On
  failure show `getUserFacingError(error)` only. Payload shape and endpoint
  unchanged.
- **Abort path:** when `isAbortVisible`, collect a reason and call
  `props.abortBuild(false, reason)` (Close) / `props.abortBuild(true, reason)`
  (confirm). Unchanged.
- **Secret-wiping effect:** keep the `wasVisible` ref + `useEffect` that, on the
  transition from visible to not-visible (`props.visible || props.isAbortVisible`
  going true→false), resets `data, keyName, keyValue, editingItem, branchName,
  workFlowValue, abortReason, revealedKeys`. Hard security requirement — keep its
  logic identical.
- **Masking by default:** env values render as `••••••••` unless
  `revealedKeys[id]` is true; the key-value entry field is secure by default
  (now via `SecureField`).

## Target component structure

A single `BuildTriggerModal` component (same file, same default export). Inside
the `<Modal>`:

- `styles` rebuilt from `useTheme()` tokens inline (no raw color literals; the
  current file's hardcoded colors like `'white'`, `'#007BFF'`, `'#ccc'`,
  `rgba(0,0,0,0.5)` are all removed).
- Root: `<Modal transparent visible={props.visible || props.isAbortVisible}
  animationType={reduceMotion ? 'none' : 'slide'}>`.
- Scrim `View` (flex:1, justifyContent:'flex-end', solid translucent-free
  background using `colors.background` with opacity handled by a plain overlay
  color token — no blur). A full-width bottom-anchored sheet container:
  `secondaryGroupedBackground`, top corners `radius.lg`, `maxHeight` ≈ 90% for
  the large detent feel, inner content in a `ScrollView` so it stays usable at
  large Dynamic Type.
- **Grab handle:** a small centered rounded `View` (`colors.separator`, ~36x5,
  `radius.sm`) at the top, `accessible={false}` (decorative).
- **Two modes inside** (same `isAbortVisible` branch as today):
  - **Trigger mode:** header `type.title2` "Build Configuration"; then three
    `SectionCard`s:
    1. `SectionCard title="BRANCH"` → a plain themed `TextInput` (non-secret),
       `accessibilityLabel="Branch name"`.
    2. `SectionCard title="WORKFLOW ID"` → themed `TextInput`,
       `accessibilityLabel="Workflow ID"`.
    3. `SectionCard title="ENVIRONMENT VARIABLES"` → the add/edit form
       (key-name `TextInput` + key-value `SecureField`), an Add/Save button
       (`SecondaryButton`), and the list of added rows. Each row shows
       `keyName: ••••••••`/value with a `show`/`hide` `AppIcon` toggle button
       (labeled), an Edit button, and a new **Remove** affordance (trash/`abort`
       icon button, labeled) that filters the row out of `data` — the small
       allowed enhancement. Rows are rendered by mapping over `data` inside the
       `ScrollView` (replace the nested `FlatList`, which nests a VirtualizedList
       inside a ScrollView and warns; the list is tiny so `.map` is correct
       here).
  - **Abort mode:** header `type.title2` "Add abort reason"; a themed
    `TextInput` for the reason; buttons row.
- **Button row** (both modes): `SecondaryButton` "Cancel" on the LEFT,
  primary on the RIGHT. Trigger mode right button = `PrimaryButton`
  "Start Build" (disabled until valid, fires `impactLight` via BaseButton, then
  `triggerBuid`). Abort mode right button = `DestructiveButton` "Abort Build"
  which fires `notificationWarning` then `props.abortBuild(true, abortReason)`.
  Keep existing `keyboardType`/`autoCapitalize`/`spellCheck` on the branch/
  workflow/reason inputs.

Keep `addData`, `editData`, `saveEditedData`, `resetForm`, `triggerBuid`
logic intact; only their presentation and the haptic calls change. Replace the
imperative `Alert.alert('Error', ...)` validation in add/save as-is (still fine)
— no behavior change required there.

Files: `View/BuildTriggerModal/BuildTriggerModal.tsx`

Verify: `npm run lint` from repo root — 0 errors (still only the 2 pre-existing
RadioButton.tsx warnings; no new `react/no-unstable-nested-components` or
color-literal issues).

## Implementation steps

- [ ] 1. Rewrite `BuildTriggerModal.tsx` presentation on theme + shared
      components, preserving all logic above. Replace hardcoded styles with
      `useTheme()` tokens; swap the key-value input for `SecureField`; swap the
      `FlatList` for a `.map` inside a `ScrollView`; add grab handle, rounded-top
      sheet container, medium/large detent feel (maxHeight cap) and the
      `animationType` Reduce-Motion gate; add the Reduce Transparency local
      detection keeping the surface solid; add the Cancel(left)/Start Build(right)
      button row with `PrimaryButton` disabled until `branch` & `workflow` are
      non-empty; add per-row Remove; add `notificationSuccess` on trigger OK and
      `notificationWarning` on abort confirm; keep the `wasVisible` secret-wiping
      effect and the exact trigger/abort payloads and endpoint. Add `testID`s:
      `trigger-modal`, `branch-input`, `workflow-input`, `start-build-button`,
      `cancel-button`, `env-key-name-input`, `env-key-value` (SecureField forwards
      props), `add-env-button`, and per row `reveal-toggle-<id>` /
      `remove-env-<id>`.
      Files: `View/BuildTriggerModal/BuildTriggerModal.tsx`
      Verify: `npm run lint` — 0 errors / 2 pre-existing warnings. Leaves the
      codebase buildable (TypeScript compiles under the lint/test toolchain).

- [ ] 2. Add a react-test-renderer test for BuildTriggerModal. Mock
      `../../API Calls/TokenStorage` (`getToken` → `'tok'`) and
      `../../API Calls/APIService` (a class whose `post` is a `jest.fn()`
      resolving `{status:'ok'}`), mirroring the mock style in
      `View/__tests__/BuildLists.test.tsx`. Render with the real props contract.
      Cover the four required cases (below). Use `act` for async, and read
      `secureTextEntry` off `TextInput` nodes and labels off `Text` nodes as the
      existing tests do.
      Files: `View/BuildTriggerModal/__tests__/BuildTriggerModal.test.tsx`
      Verify: `npm test` from repo root — 22 suites, all passing (91 prior + the
      new suite's cases), no regressions.

### Required test cases (step 2)

1. **Secret-wiping on close.** Render with `visible={true}`, type into the
   branch input and add an env var, then re-render with `visible={false}` (and
   `isAbortVisible={false}`). Re-open with `visible={true}` and assert the branch
   input value is empty and no env rows remain — proving the wipe fired on the
   true→false transition.
2. **Env values masked by default + reveal toggles.** Add an env var; assert the
   row text shows the mask `••••••••` (not the value). Press the row's
   `reveal-toggle-<id>` and assert the real value now appears; press again and
   assert it is masked again.
3. **Start Build disabled until branch + workflow non-empty.** On first render
   assert the `start-build-button` has `accessibilityState.disabled === true`.
   Set branch only → still disabled. Set workflow too → assert
   `accessibilityState.disabled === false`.
4. **Trigger payload shape unchanged.** With branch `"main"`, workflow `"primary"`,
   and one env var `{keyName:'API_URL', keyValue:'https://x'}`, press
   `start-build-button` and assert the mocked `ApiService.post` was called with
   body deep-equal to
   `{hook_info:{type:'bitrise'}, build_params:{branch:'main',
   workflow_id:'primary', environments:[{mapped_to:'API_URL',
   value:'https://x', is_expand:true}]}}` and the trigger URL/headers
   (`Authorization:'tok'`). (Capture the post spy via a module-level `current`
   holder as `BuildLists.test.tsx` does so the test can read call args.)

Keep every existing test passing unchanged.

## Verification (run from repo root, both must stay green)

- `npm run lint` → 0 errors; only the 2 pre-existing `RadioButton.tsx` warnings.
- `npm test` → all suites pass (prior 21 + the new BuildTriggerModal suite = 22),
  91 prior assertions still pass plus the 4 new cases.

## Risks / assumptions

- **Detent fidelity.** A restyled RN `<Modal>` gives a *detent feel* (bottom
  sheet, grab handle, rounded top, large-detent max-height), not true
  interactive native drag-to-resize detents. This is the documented, lowest-risk
  choice given the imperative `visible`-prop invocation; true native detents
  would need a navigation-presented sheet (out of scope). Noted for manual
  verification (task 12).
- **No new dependency.** Reanimated is available but intentionally unused here;
  the Modal's built-in slide (Reduce-Motion gated) is enough.
- **Reduce Transparency.** Surface is solid by construction, so the fallback is a
  no-op guarantee rather than a blur-swap; local `AccessibilityInfo` detection is
  included for correctness without expanding `useTheme` (out of scope).
- **FlatList → .map.** Removing the nested `FlatList` is safe because the env
  list is small and user-entered; it also removes the VirtualizedList-in-
  ScrollView warning. If a very large list were expected this would need
  reconsidering, but it is not.
- **Assumption:** the minimum validity rule is branch-non-empty AND
  workflow-non-empty (from R10); env vars remain optional.
