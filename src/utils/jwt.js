const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ngalam_fix_pro_jwt_secret_key_2026_super_secure_auth_token';

const EXPIRATION = {
  REMEMBER: '30d',
  STANDARD: '1d',
  REMEMBER_SECONDS: 30 * 24 * 60 * 60,
  STANDARD_SECONDS: 24 * 60 * 60
};

function generateToken(payload, rememberMe = false) {
  const expiresIn = rememberMe ? EXPIRATION.REMEMBER : EXPIRATION.STANDARD;
  const maxAge = rememberMe ? EXPIRATION.REMEMBER_SECONDS : EXPIRATION.STANDARD_SECONDS;

  const cleanPayload = { ...payload, rememberMe: Boolean(rememberMe) };
  const token = jwt.sign(cleanPayload, JWT_SECRET, { expiresIn });

  return {
    token,
    expiresIn,
    maxAge
  };
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function decodeToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

module.exports = {
  JWT_SECRET,
  EXPIRATION,
  generateToken,
  verifyToken,
  decodeToken
};
