# Tasks — Full UI Redesign (Apple HIG)

Implement in order. Each task lists the requirements it satisfies. After each
task: run `npm run lint` and `npm test` and keep both green.

- [x] 0. Install dependencies
  - react-native-nitro-sfsymbols, react-native-nitro-modules, react-native-haptic-feedback
  - _Requirements: R7, R11_ (DONE)

- [x] 1. Theme foundation (`View/Theme/`)
  - 1.1 `colors.ts` — semantic tokens via PlatformColor (iOS) + useColorScheme palette (Android), status + destructive tokens, AA-checked.
  - 1.2 `typography.ts` — Apple text styles + mono family, Dynamic Type on.
  - 1.3 `spacing.ts` — 8pt grid, radii, hitSlop, minTouchTarget, maxContentWidth.
  - 1.4 `icons.ts` — name → { ios, android } mapping table (full list from design).
  - 1.5 `useTheme.ts` — hook exposing colors/type/spacing/scheme/reduceMotion/boldText, live-updating.
  - 1.6 Unit test for useTheme + colors shape.
  - _Requirements: R3, R4, R5, R6, R8_

- [x] 2. Jest native mocks
  - Mock react-native-nitro-sfsymbols and react-native-haptic-feedback in jest setup so tests run on Node.
  - _Requirements: R13_

- [x] 3. Shared components — foundation
  - 3.1 `AppIcon.tsx` — SF Symbol (iOS) / Material Symbol (Android), weight/scale/rendering/effect, decorative-by-default, Reduce Motion gate. + test.
  - 3.2 `StatusBadge.tsx` — color + AppIcon + text label per BuildState; running animates (Reduce-Motion gated). + test.
  - 3.3 `PrimaryButton`, `SecondaryButton`, `DestructiveButton` — themed, 44pt targets, loading state, haptics on press. + tests.
  - 3.4 `SecureField.tsx` — masked field, eye toggle, enforced secure defaults. + test (asserts secure props).
  - _Requirements: R2, R7, R8, R11, R12_

- [x] 4. Shared components — layout & states
  - 4.1 `SectionCard.tsx`, `ListRow.tsx` (leading icon, title, subtitle, accessory/chevron, combined a11y label).
  - 4.2 `EmptyState.tsx`, `ErrorState.tsx` (sanitized message + Retry), `SkeletonRow.tsx` (shimmer, Reduce-Motion gated). + tests.
  - _Requirements: R6, R9, R12_

- [x] 5. LoginForm refactor (`View/TokenForm.tsx`)
  - Welcome layout, app glyph, SecureField, PrimaryButton with loading, inline errors (no alerts), keyboard handling. Preserve auto-login + keychain save + getUserFacingError.
  - _Requirements: R1, R2, R5, R9, R10, R12_

- [x] 6. Apps List refactor (`View/AppList.tsx`)
  - Large title, inset grouped SectionList, ListRow rows, pull-to-refresh, local search, skeleton/empty/error states, Log Out in menu with destructive confirm. Preserve pagination + clearToken.
  - _Requirements: R1, R6, R8, R9, R10, R12_

- [x] 6.5 Migrate navigator to `@react-navigation/native-stack` (`App.tsx`)
  - Swap `@react-navigation/stack` → `@react-navigation/native-stack`. Keep all
    four route names unchanged. Enables native large-title collapse (Apps List,
    BuildList) and native sheet detents for the trigger modal (task 9).
  - Retrofit `headerLargeTitle` on Apps List and BuildList; keep in-screen search.
  - _Requirements: R6, R10_ (approved by user)

- [x] 7. BuildList refactor (`View/BuildLists.tsx` + `BuildListViews/*`)
  - Large title (app name), card rows with StatusBadge/mono fields/relative time/duration, running animation, toolbar Trigger, swipe+context-menu Abort with destructive reason sheet, infinite scroll + pull-to-refresh + empty/error. Preserve pagination, trigger, abort payloads.
  - _Requirements: R1, R5, R8, R9, R10, R11, R12_

- [x] 8. BuildDetailView + AnsiText (`View/BuidDetailView.tsx`, `View/AnsiText.tsx`)
  - Summary card, monospaced theme-aware log container, theme-aware ANSI palette (AA in both modes), auto-scroll, jump-to-bottom button, Load Full Log with progress, selectable text. Preserve full-log fetch. + update/add AnsiText test.
  - _Requirements: R1, R5, R9, R10, R12_

- [x] 9. BuildTriggerModal refactor (`View/BuildTriggerModal/`)
  - Native sheet with detents + grab handle (solid-modal fallback), grouped sections, masked env rows with per-row reveal, Cancel/Start Build, primary disabled until valid, haptics. Preserve secret-wiping on close + trigger/abort behavior.
  - _Requirements: R1, R2, R8, R10, R11, R12_

- [x] 10. Tests + snapshots
  - Update App.test.tsx and impacted snapshots; ensure new component tests present. `npm run lint` + `npm test` green.
  - _Requirements: R13_

- [x] 11. Docs
  - Write `UI_REDESIGN.md`: design decisions, color rationale, per-screen before/after notes.
  - _Requirements: R14_

- [ ] 12. Manual verification (requires simulators/emulator + pod install)
  - `pod install` for iOS. Verify iPhone (small + Pro Max), iPad, Android, each in light + dark, at largest Dynamic Type. List any issues.
  - _Requirements: R3, R5, R6, R14_
