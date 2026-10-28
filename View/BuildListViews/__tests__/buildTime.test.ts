/**
 * @format
 */

import {describe, expect, it} from '@jest/globals';
import {formatDuration, relativeTime} from '../buildTime';

const NOW = Date.parse('2024-01-10T12:00:00Z');

describe('relativeTime', () => {
  it('returns "just now" for a timestamp under a minute old', () => {
    const then = new Date(NOW - 30 * 1000).toISOString();
    expect(relativeTime(then, NOW)).toBe('just now');
  });

  it('returns minutes for a few minutes ago', () => {
    const then = new Date(NOW - 4 * 60 * 1000).toISOString();
    expect(relativeTime(then, NOW)).toBe('4 min ago');
  });

  it('returns hours for a few hours ago', () => {
    const then = new Date(NOW - 2 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(then, NOW)).toBe('2 hr ago');
  });

  it('returns days for several days ago', () => {
    const then = new Date(NOW - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(then, NOW)).toBe('3 days ago');
  });

  it('singularizes a single day', () => {
    const then = new Date(NOW - 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(then, NOW)).toBe('1 day ago');
  });

  it('returns a safe fallback for empty/invalid input', () => {
    expect(relativeTime('', NOW)).toBe('—');
    expect(relativeTime('not-a-date', NOW)).toBe('—');
    expect(relativeTime(null, NOW)).toBe('—');
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    const start = '2024-01-10T12:00:00Z';
    const end = '2024-01-10T12:00:45Z';
    expect(formatDuration(start, end)).toBe('45 sec');
  });

  it('formats minutes and seconds', () => {
    const start = '2024-01-10T12:00:00Z';
    const end = '2024-01-10T12:01:12Z';
    expect(formatDuration(start, end)).toBe('1 min 12 sec');
  });

  it('formats hours and minutes', () => {
    const start = '2024-01-10T12:00:00Z';
    const end = '2024-01-10T13:03:00Z';
    expect(formatDuration(start, end)).toBe('1 hr 3 min');
  });

  it('returns empty string for a running build (null finished_at)', () => {
    expect(formatDuration('2024-01-10T12:00:00Z', null)).toBe('');
  });

  it('returns empty string for invalid/empty input', () => {
    expect(formatDuration('', '2024-01-10T12:00:00Z')).toBe('');
    expect(formatDuration('bad', 'bad')).toBe('');
  });
});
