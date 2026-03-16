/**
 * API Error Types
 *
 * Custom error classes that extend the standard Error class.
 * These integrate with the standard error response format defined in lib/api-response.ts
 *
 * Usage:
 *   throw new NotFoundError('Image', 'imageId');
 *   throw new ValidationError('Invalid email format', { field: 'email' });
 */

import { ErrorCodes } from './api-response';

/**
 * Base error class - all custom errors inherit from this
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code: string = ErrorCodes.INTERNAL_ERROR, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }

  toResponse() {
    return {
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * Validation Error
 * Use for input validation failures
 */
export class ValidationError extends ApiError {
  public readonly field?: string;

  constructor(message: string, field?: string, details?: unknown) {
    super(message, ErrorCodes.VALIDATION_ERROR, details);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, ErrorCodes.UNAUTHORIZED);
    this.name = 'AuthenticationError';
  }
}

/**
 * Forbidden Error
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, ErrorCodes.FORBIDDEN);
    this.name = 'ForbiddenError';
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends ApiError {
  public readonly resourceType: string;

  constructor(resource: string, identifier?: string) {
    super(
      identifier ? `${resource} not found: ${identifier}` : `${resource} not found`,
      ErrorCodes.NOT_FOUND
    );
    this.name = 'NotFoundError';
    this.resourceType = resource;
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends ApiError {
  public readonly retryAfter?: number;

  constructor(retryAfter?: number) {
    super('Too many requests. Please try again later.', ErrorCodes.RATE_LIMIT_EXCEEDED);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * File Upload Errors
 */
export class FileTooLargeError extends ApiError {
  public readonly maxSize: string;

  constructor(maxSize: string) {
    super(`File too large. Maximum size is ${maxSize}.`, ErrorCodes.FILE_TOO_LARGE);
    this.name = 'FileTooLargeError';
    this.maxSize = maxSize;
  }
}

export class InvalidFileTypeError extends ApiError {
  public readonly allowedTypes: string[];

  constructor(allowedTypes: string[]) {
    super(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      ErrorCodes.INVALID_FILE_TYPE
    );
    this.name = 'InvalidFileTypeError';
    this.allowedTypes = allowedTypes;
  }
}

// Re-export for convenience
export { ErrorCodes } from './api-response';
