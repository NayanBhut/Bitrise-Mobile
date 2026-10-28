# Orchestrator notes for the HIG review/fix run

These notes are from the top-level orchestrator (not a reviewer finding). Treat
them as authoritative instructions for this review run.

## Already fixed before the fix step (do NOT redo)

Commit `c91fa8d` on `feature/ui-redesign-apple-hig` fixed two PRODUCTION-code
type errors:

- `View/AppList.tsx` (~line 467) and `View/BuildLists.tsx` (~line 305):
  `ListFooterComponent={ cond ? (<View/>) : null }` — React Native's prop type
  is `Element | ComponentType | undefined` and rejects `null`. Changed the else
  branch from `null` to `undefined`. These two are resolved; the branch HEAD is
  `c91fa8d`.

## REQUIRED finding to record (Medium) and fix

**The lint and test gates do not type-check.** `npm test` uses the Babel/jest
transform, which strips TypeScript types without checking them, and `eslint`
does not run the TS compiler. As a result, real type errors pass both gates.
Record this as a **Medium** finding in REVIEW.md: "Type errors are not caught by
the lint/test gates."

### Fix required

1. Run `npx tsc --noEmit` from the repo root. After commit `c91fa8d`, the only
   remaining errors are in TEST files — fix all of them:
   - Untyped jest mocks resolving to `never` (e.g. `mockResolvedValue` /
     `mockReturnValue` on getToken / ApiService) in:
     `View/__tests__/AppList.test.tsx`, `View/__tests__/TokenForm.test.tsx`,
     `View/__tests__/BuildLists.test.tsx`,
     `View/__tests__/BuildDetailView.test.tsx`,
     `View/BuildTriggerModal/__tests__/BuildTriggerModal.test.tsx`.
     Fix by typing the mocks properly (e.g. `jest.mocked(...)` or
     `as jest.Mock`) rather than casting data to `never`.
   - Invalid `AppsModel` casts missing `total_item_count` / `page_item_limit`
     in `View/__tests__/AppList.test.tsx` — give the mock paging object the full
     shape (or build via a typed factory), not a bare `{ next }`.
   - Four now-unused `@ts-expect-error` directives in
     `View/__tests__/BuildDetailView.test.tsx` — remove them.

2. ADD `npx tsc --noEmit` as a REQUIRED verification gate for this run,
   alongside `npm run lint` and `npm test`. Record its clean (zero-error) output
   in REVIEW.md's verification section and in the "Ready to ship" checklist.

Do not weaken types to silence errors (no blanket `any`, no disabling
`strict`). Keep the gates green: lint 0 errors, tests passing (no skips),
`tsc --noEmit` clean.
