/**
 * Authentication and Session Guard Middlewares
 */
const { verifySession } = require('../../services/authService');

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        const key = parts.shift().trim();
        list[key] = decodeURIComponent(parts.join('='));
      }
    });
  }
  return list;
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.query && req.query.token) {
    return req.query.token;
  }
  const cookies = parseCookies(req);
  return cookies.ngalam_admin_token || cookies.ngalam_token || req.headers['x-session-token'] || null;
}

function requireAuth(allowedRoles = []) {
  return (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: Token autentikasi tidak ditemukan. Silakan login terlebih dahulu.'
      });
    }

    const session = verifySession(token);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Sesi login tidak valid atau sudah kedaluwarsa. Silakan login kembali.'
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role) && session.role !== 'admin' && session.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Anda tidak memiliki izin untuk mengakses resource ini.'
      });
    }

    req.user = session;
    next();
  };
}

module.exports = {
  parseCookies,
  extractToken,
  requireAuth
};
