const rateLimit = require('express-rate-limit');

// Configurable via env so tests can exercise a low limit without waiting
// out the production window.
const shortenRateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests, please try again later.' } },
});

module.exports = { shortenRateLimiter };
