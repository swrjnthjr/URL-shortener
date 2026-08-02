const urlService = require('../services/urlService');
const analyticsService = require('../services/analyticsService');
const { isValidShortCode } = require('../lib/shortCodeValidator');

// Click recording is decoupled from the redirect itself (architecture.md
// D7): a failure here must never fail or delay the redirect response.
async function recordClickSafely(shortCode, req) {
  try {
    await analyticsService.recordClick(shortCode, {
      referrer: req.get('referer') || null,
      userAgent: req.get('user-agent') || null,
    });
  } catch (err) {
    console.error('Failed to record click', err);
  }
}

async function redirectToLongUrl(req, res, next) {
  try {
    const { code } = req.params;

    if (!isValidShortCode(code)) {
      return res.status(404).json({ error: { message: 'Short code not found' } });
    }

    const longUrl = await urlService.resolveShortCode(code);

    if (!longUrl) {
      return res.status(404).json({ error: { message: 'Short code not found' } });
    }

    await recordClickSafely(code, req);

    // Permanent redirect (architecture.md D6) — accepted tradeoff: browsers/
    // CDNs may cache this, undercounting repeat clicks from the same client.
    return res.redirect(301, longUrl);
  } catch (err) {
    return next(err);
  }
}

module.exports = { redirectToLongUrl };
