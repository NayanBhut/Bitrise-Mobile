# Task 9 Review — BuildTriggerModal refactor (R10)

Commit: `e18347a` on `feature/ui-redesign-apple-hig`. Files changed (scope-clean):
`View/BuildTriggerModal/BuildTriggerModal.tsx` and
`View/BuildTriggerModal/__tests__/BuildTriggerModal.test.tsx` only.

## Verdict: APPROVED — no blocking findings.

## Evidence reviewed
- New and prior versions of `BuildTriggerModal.tsx` (via `git show HEAD~1:`), the
  new test file, and the shared components it leans on: `SecureField`,
  `BaseButton`/`PrimaryButton`, `AppIcon`/`icons.ts`, `APIConstants.tsx`.
- Coder's recorded verification (commit message): `npm run lint` → 0 errors / 2
  pre-existing RadioButton.tsx warnings; `npm test` → 22 suites / 95 tests
  passing (was 21/91).
- Narrow spot-check: ran only `BuildTriggerModal.test.tsx` → 4/4 passing. Used to
  confirm the four required behavior assertions actually execute; no suites rerun.

## Hard / security requirements

1. **Secret-wiping effect — PRESERVED.** The `wasVisible` ref + `useEffect`
   (lines ~82-96) is byte-for-byte identical to the prior file: on the
   `visible||isAbortVisible` true→false transition it resets `data`, `keyName`,
   `keyValue`, `editingItem`, `branchName`, `workFlowValue`, `abortReason`, and
   `revealedKeys`. All seven secret-bearing fields plus `revealedKeys` are wiped.
   Dependency array `[props.visible, props.isAbortVisible]` unchanged. Test
   "wipes secret state when the modal closes" exercises the true→false→true path
   and asserts the branch input is empty and no env rows remain. Passing.

2. **Masking by default + per-row reveal — PRESERVED and strengthened.** Env rows
   render `{item.keyName}: {revealed ? item.keyValue : MASK}` with
   `MASK = '••••••••'`; reveal is per-row via `revealedKeys[item.id]` toggled by
   the labeled `reveal-toggle-<id>` Pressable. The key-value entry field now
   routes through `SecureField`, which hard-sets `secureTextEntry`,
   `autoComplete="off"`, `autoCorrect={false}`, `spellCheck={false}`,
   `importantForAutofill="no"`, `textContentType="none"`, `autoCapitalize="none"`
   and omits those props from its public type so callers cannot weaken them.
   Default `visible` state is `false` (masked). No secret default leaks. Test
   "masks env values by default and toggles reveal" asserts the mask shows and
   the cleartext does not until reveal, then re-masks. Passing.

3. **Trigger payload / endpoint — UNCHANGED.** `triggerBuid` builds
   `objTrigger = { hook_info:{type:'bitrise'}, build_params:{ branch: branchName,
   workflow_id: workFlowValue, environments: data.map(i => ({mapped_to, value,
   is_expand:true})) } }`, POSTs to
   `API_CONFIG.endpoints.builds.trigger(props.slug)` (= `apps/{slug}/builds`,
   confirmed in APIConstants) via
   `new ApiService(API_CONFIG.BASE_URL + API_CONFIG.API_VERSION)` with headers
   `{'content-type':'application/json', Authorization: auth}`, `auth` from
   `getToken()` with the null early-return intact. Failure path still shows only
   `getUserFacingError(error)`. On OK still `props.cancel(true)`. Identical to the
   prior file; the only addition is a `notificationSuccess` haptic on the
   non-error branch (R11), which does not touch the request. Test asserts
   URL=`apps/app-slug/builds`, deep-equal body, and headers incl.
   `Authorization:'tok'`. Passing.

4. **Abort path — UNCHANGED.** Cancel calls `props.abortBuild(false, abortReason)`;
   confirm calls `confirmAbort` → `notificationWarning` haptic then
   `props.abortBuild(true, abortReason)`. Argument order and booleans match the
   prior file.

5. **Props/callback contract — INTACT.** `{ slug, visible, isAbortVisible,
   abortBuild(abort,reason), cancel(status) }` and the exported `CustomKeyModel`
   interface are unchanged, so `BuildLists.tsx` needs no edit — and the diff
   confirms it was not touched.

## Scope / forbidden files
- Only the two in-scope files changed (verified via `git show --name-only`). No
  edits to other screens, `API Calls/`, or `View/APIConstants/APIConstants.tsx`.
  No renames, no route changes.

## R10 / R11 / R12 UI-UX
- Sheet presentation: restyled RN `<Modal transparent>` bottom-anchored
  (`scrim` justifyContent flex-end), rounded top corners (`radius.lg`), grab
  handle (36x5, `radius.sm`, decorative `accessible={false}`), large-detent feel
  via `maxHeight = height*0.9` with inner `ScrollView`. Documented trade-off:
  restyled Modal gives a detent *feel*, not interactive native drag detents
  (option (a) chosen because invocation is imperative via props; option (b) would
  require route + contract changes — out of scope). Acceptable per plan.
- Reduce Transparency: surface and scrim are solid by construction; local
  `AccessibilityInfo.isReduceTransparencyEnabled` keeps scrim opaque; never a
  blur material. Satisfies R12 solid fallback.
- Grouped SectionCards BRANCH / WORKFLOW ID / ENVIRONMENT VARIABLES present.
- Cancel (`SecondaryButton`) LEFT, Start Build (`PrimaryButton`) RIGHT.
- Start Build `disabled={!isTriggerValid}` where
  `isTriggerValid = branchName.trim() !== '' && workFlowValue.trim() !== ''`.
  Test confirms disabled until both non-empty. Passing.
- Haptics: `impactLight` on primary press via BaseButton, `notificationSuccess`
  on trigger OK, `notificationWarning` on abort confirm.
- Theme tokens only; all prior color literals (`white`, `#007BFF`, `#ccc`,
  `rgba(0,0,0,0.5)`, `black`) removed. `colorToString` guards the AppIcon color
  prop against non-string PlatformColor tokens.
- Accessibility: icon-only Pressables (reveal/edit/remove) have
  accessibilityLabel + hint and `minWidth/minHeight = spacing.minTouchTarget`
  (44pt) with `hitSlop`. Inputs have accessibilityLabels.

## Tests
- New react-test-renderer suite asserts all four required behaviors: secret-wipe
  on close, mask-by-default + reveal toggle, Start Build disabled-until-valid,
  and exact trigger payload/url/headers. Spot-check: 4/4 passing.
- Coder's recorded lint (0 errors) and full suite (22/95) accepted per
  instructions; not rerun.

## Notes (non-blocking, not findings)
- `FlatList` replaced by `.map` inside the `ScrollView` — removes the nested
  VirtualizedList warning; safe for the small user-entered env list.
- New per-row Remove affordance is the plan's allowed enhancement and does not
  affect the payload or security surface.
