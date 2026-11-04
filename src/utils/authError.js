class AuthError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'AuthError';
    this.status = Number(options.status) || 400;
    this.code = options.code || 'AUTH_ERROR';
    this.field = options.field || '';
  }
}

function sendAuthError(res, err, fallbackMessage = 'Terjadi kesalahan autentikasi.') {
  const status = Number(err && err.status) || 500;
  const message = (err && err.message) || fallbackMessage;
  return res.status(status).json({
    success: false,
    code: (err && err.code) || 'AUTH_ERROR',
    field: (err && err.field) || '',
    error: message,
    message
  });
}

module.exports = {
  AuthError,
  sendAuthError
};
