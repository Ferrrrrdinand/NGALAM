/**
 * Centralized Error Handling Middlewares
 */
function jsonSyntaxErrorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, error: 'Format JSON request body tidak valid.' });
  }
  next(err);
}

function globalErrorHandler(err, req, res, next) {
  console.error('[Internal Server Error]', err);
  if (res.headersSent) return next(err);
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Terjadi kesalahan internal pada server.'
  });
}

module.exports = {
  jsonSyntaxErrorHandler,
  globalErrorHandler
};
