const db = require('../lib/db');
const base62 = require('../lib/base62');

async function createShortUrl(longUrl) {
  const insertResult = await db.query('INSERT INTO urls (long_url) VALUES ($1) RETURNING id', [
    longUrl,
  ]);
  const { id } = insertResult.rows[0];
  const shortCode = base62.encode(id);

  await db.query('UPDATE urls SET short_code = $1 WHERE id = $2', [shortCode, id]);

  return { id, shortCode, longUrl };
}

async function resolveShortCode(shortCode) {
  const id = base62.decode(shortCode);
  const result = await db.query('SELECT long_url FROM urls WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].long_url;
}

module.exports = { createShortUrl, resolveShortCode };
