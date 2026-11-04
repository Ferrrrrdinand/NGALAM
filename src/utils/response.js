/**
 * Standardized API Response Helpers
 */
function successResponse(res, data = null, message = null, statusCode = 200) {
  const payload = { success: true };
  if (message) payload.message = message;
  if (data !== null) {
    if (typeof data === 'object' && !Array.isArray(data)) {
      Object.assign(payload, data);
    } else {
      payload.data = data;
    }
  }
  return res.status(statusCode).json(payload);
}

function errorResponse(res, message = 'Terjadi kesalahan pada server.', statusCode = 500, errors = null) {
  const payload = {
    success: false,
    message: typeof message === 'string' ? message : (message.message || 'Terjadi kesalahan.')
  };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
}

module.exports = {
  successResponse,
  errorResponse
};
