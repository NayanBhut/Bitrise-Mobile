/**
 * UI-only time helpers for the build list. These never touch model data or the
 * API layer — they only format already-fetched Bitrise timestamps for display.
 */

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Parse a Bitrise timestamp string, returning `null` when invalid/empty. */
function parse(value: string | null | undefined): number | null {
  if (value == null || value === '') {
    return null;
  }
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Relative time like "just now" / "4 min ago" / "2 hr ago" / "3 days ago".
 * `nowMs` defaults to `Date.now()` but is injectable for deterministic tests.
 * Returns an em dash fallback for missing/invalid input.
 */
export function relativeTime(
  isoOrDateString: string | null | undefined,
  nowMs: number = Date.now(),
): string {
  const then = parse(isoOrDateString);
  if (then == null) {
    return '—';
  }

  const diff = Math.max(0, nowMs - then);

  if (diff < MINUTE_MS) {
    return 'just now';
  }
  if (diff < HOUR_MS) {
    const minutes = Math.floor(diff / MINUTE_MS);
    return `${minutes} min ago`;
  }
  if (diff < DAY_MS) {
    const hours = Math.floor(diff / HOUR_MS);
    return `${hours} hr ago`;
  }
  const days = Math.floor(diff / DAY_MS);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

/**
 * Human-readable duration like "45 sec" / "1 min 12 sec" / "1 hr 3 min".
 * Returns '' when either timestamp is missing/invalid (so running builds — with
 * a null `finished_at` — show no duration).
 */
export function formatDuration(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
): string {
  const start = parse(startIso);
  const end = parse(endIso);
  if (start == null || end == null) {
    return '';
  }

  const diff = end - start;
  if (diff < 0) {
    return '';
  }

  const totalSeconds = Math.floor(diff / SECOND_MS);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  if (minutes > 0) {
    return `${minutes} min ${seconds} sec`;
  }
  return `${seconds} sec`;
}
