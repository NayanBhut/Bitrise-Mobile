export class ApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Converts an internal/API error into a short message that is safe to show to
 * the user. Raw server responses and stack traces must never be displayed.
 */
export function getUserFacingError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return 'Your Bitrise token is invalid or expired. Please sign in again.';
    }
    if (error.statusCode === 404) {
      return 'The requested item could not be found.';
    }
    if (error.statusCode === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (error.statusCode >= 500) {
      return 'Bitrise is temporarily unavailable. Please try again later.';
    }
    if (error.statusCode >= 400) {
      return 'The request could not be completed. Check your inputs and try again.';
    }
  }

  return 'Something went wrong. Check your connection and try again.';
}
