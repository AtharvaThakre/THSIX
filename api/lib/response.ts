import type { VercelResponse } from '@vercel/node';

export interface ApiResponse<T = any> {
  ok: boolean;
  result?: T;
  errorCode?: string | null;
  message?: string;
}

/**
 * Send success response
 */
export function sendSuccess<T>(res: VercelResponse, data: T, statusCode = 200): VercelResponse {
  return res.status(statusCode).json({
    ok: true,
    result: data,
    errorCode: null
  } as ApiResponse<T>);
}

/**
 * Send error response
 */
export function sendError(
  res: VercelResponse,
  message: string,
  statusCode?: number,
  errorCode?: string
): VercelResponse {
  const code = statusCode ? statusCode : 400;
  const error = errorCode ? errorCode : 'ERROR';
  return res.status(code).json({
    ok: false,
    result: null,
    errorCode: error,
    message
  } as ApiResponse);
}

/**
 * Send authentication error
 */
export function sendAuthError(res: VercelResponse, message = 'Authentication failed'): VercelResponse {
  return sendError(res, message, 511, 'AUTH_ERROR');
}

/**
 * Send not found error
 */
export function sendNotFound(res: VercelResponse, message = 'Resource not found'): VercelResponse {
  return sendError(res, message, 404, 'NOT_FOUND');
}

/**
 * Send validation error
 */
export function sendValidationError(res: VercelResponse, message: string): VercelResponse {
  return sendError(res, message, 400, 'VALIDATION_ERROR');
}
