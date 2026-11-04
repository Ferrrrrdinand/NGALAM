/**
 * Parse currency string or number to clean float/integer
 * e.g. "Rp 1.450.000" -> 1450000, "Rp 350.000" -> 350000
 */
function parseNumeric(val, fallback = 0) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const str = String(val).trim();
  if (!str) return fallback;

  // Extract first group of numbers if range like "Rp 150.000 - Rp 450.000"
  const rangeMatch = str.match(/([0-9.,]+)/);
  if (!rangeMatch) return fallback;

  const clean = rangeMatch[1].replace(/[^0-9]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? fallback : parsed;
}

module.exports = {
  parseNumeric
};
