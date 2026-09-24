/**
 * Send success response
 */
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    ok: true,
    data: data,
    errorCode: null
  });
}

/**
 * Send error response
 */
function sendError(res, message, statusCode, errorCode) {
  const code = statusCode || 400;
  const error = errorCode || 'ERROR';
  return res.status(code).json({
    ok: false,
    result: null,
    errorCode: error,
    message
  });
}

/**
 * Send authentication error
 */
function sendAuthError(res, message = 'Authentication failed') {
  return sendError(res, message, 511, 'AUTH_ERROR');
}

/**
 * Send not found error
 */
function sendNotFound(res, message = 'Resource not found') {
  return sendError(res, message, 404, 'NOT_FOUND');
}

/**
 * Send validation error
 */
function sendValidationError(res, message) {
  return sendError(res, message, 400, 'VALIDATION_ERROR');
}

module.exports = {
  sendSuccess,
  sendError,
  sendAuthError,
  sendNotFound,
  sendValidationError
};