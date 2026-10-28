# HIG Redesign — Review & Fix Run

Branch: `feature/ui-redesign-apple-hig`
Review HEAD: `70916d8` (fix commits `e0132b9`, `70916d8` on top of the redesign work `c91fa8d`)
Scope: final review/fix pass over the Apple-HIG UI redesign, the SF Symbols
library migration, and the three quality gates (lint / test / `tsc --noEmit`).

## Verdict

APPROVED. All implementation tasks (0–11) are complete and the three gates are
green. The one required review finding (below) is fixed. Task 12 (manual
device/simulator verification) remains open by design — it needs real hardware.

## Findings

### 1. Type errors were not caught by the lint/test gates — Medium — FIXED

`npm test` runs through the Babel/jest transform, which strips TypeScript types
without checking them, and `eslint` does not invoke the TS compiler. Real type
errors therefore passed both gates unnoticed (e.g. untyped jest mocks resolving
to `never`, incomplete `AppsModel` paging casts, and stale `@ts-expect-error`
directives in the test suite).

Fix:
- `npx tsc --noEmit` is now a REQUIRED gate for this project, run alongside
  `npm run lint` and `npm test`.
- All remaining `tsc` errors (29 at the start of this run, all in the 5 screen
  test files) were cleared without weakening types — no blanket `any`, no
  disabling `strict`:
  - jest mocks given explicit signatures (`jest.fn<(...) => Promise<...>>()` /
    `jest.mocked`) instead of casting data to `never`;
  - `AppsModel` paging mocks built with the full shape
    (`total_item_count` / `page_item_limit`), not a bare `{ next }`;
  - the four unused `@ts-expect-error` directives in
    `View/__tests__/BuildDetailView.test.tsx` removed;
  - `BuildTriggerModal.test.tsx` `mockPost` typed as
    `(url, body, headers) => Promise<unknown>` so its `post` spy and
    `mock.calls[0]` tuple type check cleanly.
- No changes were made under `API Calls/` or `View/APIConstants/` to satisfy
  types (guardrail preserved).

### 2. SF Symbols library + iOS deployment target — FIXED (product decision confirmed)

The original `react-native-nitro-sfsymbols` is locked to `:ios => "16.0"` and is
Nitro / New-Architecture bound, so `pod install` failed with "required a higher
minimum deployment target." It was replaced by
`@mythologi/react-native-sfsymbols@2.2.1` (installed from npm; podspec
`:ios => "13.0"`, depends only on `React-Core`), keeping SF Symbols as the only
iOS icon source.

An attempt to set the app floor to iOS 13.0 surfaced a hard conflict: React
Native 0.88 itself requires iOS 15.1 (its Fabric / ReactCommon / Yoga / Hermes
pods hard-require it), so a clean `pod install` fails at any floor below 15.1.
Raising the minimum deployment target is a user-visible product decision; it was
escalated and the user confirmed iOS 15.1 (they had no hard iOS-13 requirement;
React Native was not downgraded). The Podfile keeps the floor at RN's own
minimum via `platform :ios, min_ios_version_supported` (resolves to 15.1), and
the Xcode project's `IPHONEOS_DEPLOYMENT_TARGET` is 15.1 across all configs.
`UI_REDESIGN.md` and `design.md` were updated to record the iOS 15.1 minimum and
the rationale.

## Prior per-task reviews (carried forward)

Tasks 4–11 were each reviewed and landed APPROVED; see `task4-review.md`,
`task5-6-review.md`, `task7-review.md`, `task8-review.md`, `task9-review.md`,
and `task10-11-review.md`. The four non-blocking findings from the task 10–11
sweep (AppIcon iOS tint, SkeletonRow unique testIDs, BuildDetailView
jump-to-bottom extraction, AnsiText bright-white reachability) were all resolved
there. Nothing in this run regresses them.

## Hard constraints — verified

- `git diff 56012e9 HEAD -- "API Calls/" "View/APIConstants/"` is EMPTY.
- No file renames; the misspelled `View/BuidDetailView.tsx` is preserved.
- No navigation route-name changes (`LoginForm`, `Apps List`, `BuildList`,
  `BuildDetailView`).
- SF Symbols remain the only iOS icon source (no PNG/SVG/other icon fonts).
- Behavior & security preserved: keychain auto-login, pagination, trigger-build
  and abort-with-reason payloads, full-log fetch, log out, masked token with
  show/hide, secure-entry defaults on secret fields, trigger-modal secret wipe
  on close, env-var masking, and `getUserFacingError()`-only messages. This
  run's edits were test typing + native-config + docs only; no production
  behavior path was changed.

## Verification gates (this run)

- `npm run lint` → 0 errors, 2 warnings (both pre-existing inline-style warnings
  in `View/RadioButton.tsx`; none added).
- `npm test` → 104 passing / 104 total across 23 suites, 0 skipped.
- `npx tsc --noEmit` → 0 errors.
- `cd ios && bundle exec pod install` → "Pod installation complete! 97
  dependencies from the Podfile, 96 total pods installed" at the iOS 15.1 floor.

## Ready to ship

- [x] Three gates green (lint 0 errors / tests 104 passing / tsc 0 errors).
- [x] SF Symbols migrated to an actively usable, non-Nitro library.
- [x] iOS minimum deployment target reconciled with RN 0.88 (15.1) and documented.
- [x] `pod install` resolves cleanly.
- [x] Guardrails verified (no `API Calls/` / `APIConstants` changes, no renames,
      no route changes, SF-Symbols-only on iOS, behavior/security preserved).
- [ ] Task 12 — manual device/simulator verification (iPhone small + Pro Max,
      iPad, Android; light + dark; largest Dynamic Type). Requires hardware;
      still outstanding.
