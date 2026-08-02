const urlService = require('../services/urlService');
const { isValidUrl } = require('../lib/urlValidator');

async function createShortUrl(req, res, next) {
  try {
    const { url } = req.body;

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: { message: 'A valid http(s) URL is required' } });
    }

    const { shortCode } = await urlService.createShortUrl(url);
    const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;

    return res.status(201).json({ shortCode, shortUrl });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createShortUrl };
