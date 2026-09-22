export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INSUFFICIENT_STOCK"
  | "EMAIL_NOT_VERIFIED"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR";

/**
 * Thrown by services/controllers to signal an expected, user-facing failure.
 * Caught by the centralized error middleware and mapped to a consistent
 * { success: false, error } response with the right HTTP status.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = "ApiError";
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, "VALIDATION_ERROR", message, details);
  }
  static unauthorized(message = "Authentication required") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "You do not have permission to perform this action") {
    return new ApiError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }
  static conflict(message: string, details?: unknown) {
    return new ApiError(409, "CONFLICT", message, details);
  }
  static insufficientStock(message = "Not enough stock available") {
    return new ApiError(409, "INSUFFICIENT_STOCK", message);
  }
  static emailNotVerified(message = "Please verify your email before signing in") {
    return new ApiError(403, "EMAIL_NOT_VERIFIED", message);
  }
  static tooManyRequests(message: string, details?: unknown) {
    return new ApiError(429, "TOO_MANY_REQUESTS", message, details);
  }
  static internal(message = "Something went wrong") {
    return new ApiError(500, "INTERNAL_ERROR", message);
  }
}
