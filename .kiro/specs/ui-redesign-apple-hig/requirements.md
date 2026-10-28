# Requirements — Full UI Redesign (Apple HIG)

## Introduction

Redesign the entire UI of BitriseMobile so it feels like a native, first-party
Apple app that follows the current iOS design language (including Liquid
Glass-style materials where React Native supports them). The app must fully
support light and dark mode, follow system appearance automatically, work on
iPhone and iPad across all supported OS versions, and remain clean and
consistent on Android.

This is a **UI-only** effort. No business logic, networking, storage, or
security behavior changes.

## Out of scope (hard constraints)

- No changes to `API Calls/` (APIService, TokenStorage, ErrorUtils, AppsModel,
  BuildModel, BuildDetailModel, BranchModel) or `View/APIConstants/APIConstants.tsx`.
- No renaming of existing files.
- No changes to navigation route names (`LoginForm`, `Apps List`, `BuildList`,
  `BuildDetailView`).

## Requirements

### R1. Preserve all existing behavior
**User story:** As an existing user, I want everything that worked before to
keep working after the redesign.

Acceptance (EARS):
- WHEN the app launches with a token in the keychain THE SYSTEM SHALL auto-login
  and navigate to the Apps list.
- WHEN the user scrolls the apps or builds lists to the end THE SYSTEM SHALL
  paginate using the existing `next` token logic.
- WHEN the user triggers a build THE SYSTEM SHALL send the same request payload
  (branch, workflow_id, environments) as today.
- WHEN the user aborts a build THE SYSTEM SHALL send the same abort payload and
  require a reason.
- WHEN the user requests the full log THE SYSTEM SHALL fetch it from the
  existing expiring raw log URL.
- WHEN the user logs out THE SYSTEM SHALL clear the token via `clearToken()`.

### R2. Preserve all security behavior
**User story:** As a security-conscious user, I want secrets handled exactly as
safely as before.

Acceptance:
- THE SYSTEM SHALL keep the token field masked with a show/hide toggle.
- THE SYSTEM SHALL keep autofill, autocomplete, autocorrect, and spellcheck
  disabled on all secret fields (token, env-var values).
- WHEN the trigger modal closes THE SYSTEM SHALL wipe all secret state.
- THE SYSTEM SHALL mask env-var values by default with per-row reveal.
- THE SYSTEM SHALL only display messages produced by `getUserFacingError()` for
  API failures; raw server responses and stack traces SHALL NOT be shown.

### R3. System appearance (light/dark)
- THE SYSTEM SHALL follow the OS appearance automatically and update live when
  the user switches light/dark.
- THE SYSTEM SHALL use Apple semantic colors via `PlatformColor` on iOS and an
  equivalent `useColorScheme()`-driven palette on Android.
- THE SYSTEM SHALL NOT contain hardcoded color literals in components.

### R4. Centralized theme
- THE SYSTEM SHALL provide a theme module under `View/Theme/`
  (colors.ts, typography.ts, spacing.ts, useTheme.ts).
- All components SHALL consume colors, type, and spacing from the theme.

### R5. Typography and Dynamic Type
- THE SYSTEM SHALL use the system font with Apple text styles (largeTitle,
  title2, headline, body, callout, subheadline, footnote, caption).
- THE SYSTEM SHALL support Dynamic Type; text SHALL scale and layouts SHALL NOT
  break at the largest accessibility sizes.
- THE SYSTEM SHALL use a monospaced font for logs, build numbers, commit hashes,
  and branch names.

### R6. Layout and spacing
- THE SYSTEM SHALL use an 8pt spacing grid.
- All interactive targets SHALL be at least 44x44pt.
- THE SYSTEM SHALL respect safe areas and apply a readable max content width on
  iPad.

### R7. Icons — SF Symbols on iOS only
- On iOS THE SYSTEM SHALL render every icon as an SF Symbol; no PNG/SVG icon
  assets or other icon sets on iOS.
- THE SYSTEM SHALL provide a single `<AppIcon name="..." />` wrapper that renders
  an SF Symbol on iOS and the closest Material Symbol on Android from one mapping
  table.
- THE SYSTEM SHALL use symbol weights/scales matched to adjacent text,
  hierarchical or palette rendering for status icons, and symbol effects
  (bounce/pulse) only where meaningful (e.g. running build), respecting Reduce
  Motion.

### R8. Color system and status semantics
- Accent: systemBlue, used sparingly for primary/interactive elements only.
- Status colors: Success=systemGreen, Failed=systemRed, In progress=systemBlue/
  systemIndigo, On hold=systemOrange, Aborted=systemGray.
- THE SYSTEM SHALL NOT communicate status by color alone; every status SHALL
  pair color + SF Symbol + text label.
- Destructive actions (Abort, Log Out) SHALL use systemRed and a destructive
  confirmation.
- All text SHALL meet WCAG AA contrast (4.5:1 body, 3:1 large) in both modes.
- THE SYSTEM SHALL avoid pure black/white surfaces except where iOS system
  colors provide them.

### R9. Four states for every network screen
- Every screen that loads data SHALL provide: loading (skeleton), content,
  empty, and error-with-retry states.

### R10. Screen-specific requirements
- **LoginForm:** welcome screen with `hammer.circle.fill` glyph, title, one-line
  PAT explanation, grouped secure field with eye toggle, prominent filled
  "Sign In" button with loading state, subtle "where to create a token" hint,
  inline errors under the field (not alerts).
- **Apps List:** collapsing large title "Apps", inset grouped SectionList by
  owner, rows with avatar/symbol fallback + title + project type + chevron,
  pull-to-refresh, local search filter, skeleton rows, empty state, error+retry,
  Log Out in toolbar/menu with destructive confirmation.
- **BuildList:** large title with app name, card/inset rows with status
  symbol+color, build number, branch (branch symbol), workflow, relative time,
  duration; running builds animate; toolbar "Trigger Build" (play symbol); abort
  via swipe + context menu with destructive reason sheet; infinite scroll footer
  spinner, pull-to-refresh, empty, error.
- **BuildDetailView:** header summary card (status, number, branch, workflow,
  started, duration); monospaced theme-aware log container; theme-aware ANSI
  palette readable in both modes; auto-scroll to end; "Jump to bottom" floating
  button when scrolled up; "Load Full Log" action with progress; text selection
  and copy.
- **BuildTriggerModal:** native sheet with medium/large detents and grab handle;
  grouped sections Branch / Workflow ID / Environment Variables; env rows with
  masked values and per-row reveal; Cancel left, Start Build right; primary
  disabled until valid; secret-wiping preserved on close.

### R11. Interaction and feedback
- Haptics: light impact on primary actions, success notification on build
  trigger, warning on abort; no-op where unsupported.
- Native-stack transitions; Reanimated only for small purposeful animations,
  disabled under Reduce Motion.

### R12. Accessibility
- Every icon-only button SHALL have accessibilityLabel and accessibilityHint.
- Build rows SHALL read as one combined element (e.g. "Build 142, failed, branch
  main, 4 minutes ago").
- THE SYSTEM SHALL support Bold Text, Increase Contrast, Reduce Motion, and
  Reduce Transparency (solid background fallback instead of blur).
- Logical focus order and proper accessibilityRole on all controls.

### R13. Quality gates
- `npm run lint` SHALL pass.
- `npm test` SHALL pass; tests and snapshots SHALL be updated where UI changes,
  and new shared components SHALL have tests.

### R14. Deliverables
- Spec files (this set) approved before coding.
- Shared component library in `View/Components/`: AppIcon, StatusBadge, ListRow,
  SectionCard, PrimaryButton, SecondaryButton, DestructiveButton, SecureField,
  EmptyState, ErrorState, SkeletonRow.
- Theme module + iOS/Android icon mapping table.
- All five screens refactored to theme + shared components.
- Updated/new Jest tests passing + lint passing.
- `UI_REDESIGN.md` with design decisions, color rationale, before/after notes.
- Manual verification matrix (iPhone small + Pro Max, iPad, Android) × (light,
  dark) × largest Dynamic Type, with issues listed.
