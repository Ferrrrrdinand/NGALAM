const bcrypt = require('bcryptjs');

/**
 * Hash password or security PIN using bcrypt
 */
function hashPassword(password) {
  if (!password && password !== 0) return '';
  const str = String(password).trim();
  if (!str) return '';
  if (str.startsWith('$2a$') || str.startsWith('$2b$') || str.startsWith('$2y$')) {
    return str;
  }
  return bcrypt.hashSync(str, 10);
}

/**
 * Verify input password against stored hash or fallback plaintext
 */
function verifyPassword(inputPassword, storedPassword) {
  if (inputPassword === undefined || inputPassword === null) return false;
  if (!storedPassword) return false;

  const inputStr = String(inputPassword).trim();
  const storedStr = String(storedPassword).trim();

  if (storedStr.startsWith('$2a$') || storedStr.startsWith('$2b$') || storedStr.startsWith('$2y$')) {
    try {
      return bcrypt.compareSync(inputStr, storedStr);
    } catch {
      return false;
    }
  }

  // Fallback for legacy unhashed entries
  return inputStr === storedStr;
}

module.exports = {
  hashPassword,
  verifyPassword
};
