const urlService = require('../services/urlService');
const { isValidShortCode } = require('../lib/shortCodeValidator');

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

    // Permanent redirect (architecture.md D6) — accepted tradeoff: browsers/
    // CDNs may cache this, undercounting repeat clicks from the same client.
    return res.redirect(301, longUrl);
  } catch (err) {
    return next(err);
  }
}

module.exports = { redirectToLongUrl };
