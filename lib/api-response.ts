/**
 * Standardized API Error Response Utilities
 *
 * All API routes should use these utilities to ensure consistent error responses
 */

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export type ApiResponse<T = unknown> = ApiErrorResponse | ApiSuccessResponse<T>;

/**
 * Error codes for common API errors
 */
export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Upload errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
} as const;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  code?: string,
  details?: unknown
): ApiErrorResponse {
  const response: ApiErrorResponse = { error: message };
  if (code) response.code = code;
  if (details) response.details = details;
  return response;
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data?: T, message?: string): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = { success: true };
  if (data !== undefined) response.data = data;
  if (message) response.message = message;
  return response;
}

/**
 * Common error factory functions
 */
export const ApiErrors = {
  unauthorized: (message = 'Unauthorized') => createErrorResponse(message, ErrorCodes.UNAUTHORIZED),

  forbidden: (message = 'Forbidden') => createErrorResponse(message, ErrorCodes.FORBIDDEN),

  notFound: (resource = 'Resource') =>
    createErrorResponse(`${resource} not found`, ErrorCodes.NOT_FOUND),

  validationError: (message: string, details?: unknown) =>
    createErrorResponse(message, ErrorCodes.VALIDATION_ERROR, details),

  rateLimited: (retryAfter?: number) =>
    createErrorResponse(
      'Too many requests. Please try again later.',
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      retryAfter ? { retryAfter } : undefined
    ),

  internalError: (message = 'Internal server error') =>
    createErrorResponse(message, ErrorCodes.INTERNAL_ERROR),

  fileTooLarge: (maxSize: string) =>
    createErrorResponse(`File too large. Maximum size is ${maxSize}.`, ErrorCodes.FILE_TOO_LARGE),

  invalidFileType: (allowedTypes: string[]) =>
    createErrorResponse(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      ErrorCodes.INVALID_FILE_TYPE
    ),
};
