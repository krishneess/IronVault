import ApiError from '../utils/ApiError.js';

/**
 * Baseline security headers for a JSON API (no extra dependency needed).
 */
export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.secure) res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  // API responses carry personal data – never cache them in shared caches.
  if (req.path.startsWith('/api')) res.setHeader('Cache-Control', 'no-store');
  next();
}

/**
 * Fixed-window, in-memory rate limiter keyed by client IP.
 * Suitable for a single API instance; use a shared store (e.g. Redis) when scaling out.
 */
export function rateLimit({ windowMs, max, name, message = 'Too many requests. Please try again later.' }) {
  const hits = new Map();
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs);
  sweep.unref();

  return (req, res, next) => {
    if (!max) return next();
    const key = `${name}:${req.ip}`;
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return next(new ApiError(429, message, undefined, 'RATE_LIMITED'));
    }
    next();
  };
}
