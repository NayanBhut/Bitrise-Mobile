/**
 * Layout tokens: an 8pt spacing grid, corner radii, a shared hit slop, the
 * minimum interactive touch target, and a readable max content width for iPad.
 */

/** 8pt spacing grid. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Corner radii for cards, buttons, and fields. */
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;

/** Minimum interactive target size (Apple HIG / WCAG 2.5.8). */
export const minTouchTarget = 44;

/**
 * Shared hit slop that expands small controls to meet the minimum touch
 * target without changing their visual size.
 */
export const hitSlop = {top: 8, bottom: 8, left: 8, right: 8} as const;

/** Readable max content width on wide screens (iPad). */
export const maxContentWidth = 700;
