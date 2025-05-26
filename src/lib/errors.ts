// filepath: src/lib/errors.ts
// Utility to sanitize and map technical errors to user-friendly messages
export const sanitizeError = (error: any): string => {
  const errorMap: Record<string, string> = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/wrong-password': 'Invalid login credentials.',
    '23505': 'A record with this information already exists.',
    '22P02': 'Invalid input format.',
    '23503': 'Related record not found.',
    '23514': 'Input does not meet requirements.',
    // Add more mappings as needed
  };
  if (error && typeof error === 'object') {
    if (error.code && errorMap[error.code]) return errorMap[error.code];
    if (error.message && errorMap[error.message]) return errorMap[error.message];
  }
  return 'An unexpected error occurred. Please try again.';
};

// Centralized error handler for Edge Functions and client
export const handleError = (error: any): { message: string; code?: string } => {
  // Optionally log error server-side here
  return {
    message: sanitizeError(error),
    code: error.code || undefined
  };
};