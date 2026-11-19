/**
 * Security & Protection Middlewares:
 * 1. Global & Specific Rate Limiting (In-memory token bucket / sliding window)
 * 2. Security Headers (equivalent to Helmet - XSS, Clickjacking, MIME sniffing, HSTS)
 * 3. Input Sanitization & Payload Protection (NoSQL / SQL Injection / XSS vector strip)
 */

// =====================================================================
// 1. RATE LIMITER
// Window: 15 menit (900.000 ms), Max: 1000 requests per IP
// Khusus Auth / Login: Max: 30 requests per 15 menit (Anti-Bruteforce)
// =====================================================================

const ipStore = new Map();
const authStore = new Map();

// Bersihkan data lama setiap 5 menit
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipStore.entries()) {
    if (now > data.resetTime) {
      ipStore.delete(ip);
    }
  }
  for (const [ip, data] of authStore.entries()) {
    if (now > data.resetTime) {
      authStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket.remoteAddress || '127.0.0.1';
}

function rateLimiter({ windowMs = 15 * 60 * 1000, max = 1000, message = 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.' } = {}) {
  return (req, res, next) => {
    // Lewatkan static image / files
    if (req.path.startsWith('/images') || req.path.startsWith('/assets') || req.path.endsWith('.svg') || req.path.endsWith('.jpg') || req.path.endsWith('.png')) {
      return next();
    }

    const ip = getClientIp(req);
    const now = Date.now();
    let record = ipStore.get(ip);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      ipStore.set(ip, record);
    } else {
      record.count += 1;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: message,
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    next();
  };
}

// Strict limiter for authentication endpoints (Anti brute-force)
function authRateLimiter(max = 30, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const ip = getClientIp(req);
    const now = Date.now();
    let record = authStore.get(ip);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      authStore.set(ip, record);
    } else {
      record.count += 1;
    }

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Terlalu banyak percobaan autentikasi. Silakan tunggu 15 menit sebelum mencoba kembali.',
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    next();
  };
}

// =====================================================================
// 2. SECURITY HEADERS (OWASP & Anti-Hack Headers)
// =====================================================================

function securityHeaders(req, res, next) {
  // Cegah MIME Sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Cegah Clickjacking (iframe embed attacks)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // XSS Protection legacy header
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (restrict camera/mic/geo misuse)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), payment=(self)');

  // Strict Transport Security (HSTS - 1 year)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remove Express footprint
  res.removeHeader('X-Powered-By');

  next();
}

// =====================================================================
// 3. INPUT SANITIZATION & INJECTION SHIELD
// =====================================================================

function sanitizeValue(value) {
  if (typeof value === 'string') {
    // Cegah script tag injection berbahaya
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const cleaned = {};
    for (const [k, v] of Object.entries(value)) {
      // Hilangkan operator injection NoSQL mongo / prototype pollution
      if (k.startsWith('$') || k === '__proto__' || k === 'constructor') {
        continue;
      }
      cleaned[k] = sanitizeValue(v);
    }
    return cleaned;
  }
  return value;
}

function injectionShield(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
}

module.exports = {
  rateLimiter,
  authRateLimiter,
  securityHeaders,
  injectionShield
};
