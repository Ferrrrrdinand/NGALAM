/**
 * Normalize Indonesian phone numbers to 08... format
 */
function normalizePhone(val) {
  if (!val) return '';
  let digits = String(val).replace(/\D/g, '');
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  }
  return digits;
}

function phonesMatch(p1, p2) {
  const norm1 = normalizePhone(p1);
  const norm2 = normalizePhone(p2);
  if (!norm1 || !norm2) return false;
  if (norm1 === norm2) return true;
  if (norm1.length >= 8 && norm2.length >= 8) {
    return norm1.endsWith(norm2.slice(-8)) || norm2.endsWith(norm1.slice(-8));
  }
  return false;
}

function isValidPhone(val) {
  const digits = normalizePhone(val);
  return /^0\d{8,14}$/.test(digits);
}

function normalizeEmail(val) {
  return String(val || '').trim().toLowerCase();
}

function isValidEmail(val) {
  const email = normalizeEmail(val);
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = {
  normalizePhone,
  phonesMatch,
  isValidPhone,
  normalizeEmail,
  isValidEmail
};
