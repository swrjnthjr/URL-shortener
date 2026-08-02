const db = require('../lib/db');

async function recordClick(shortCode, { referrer, userAgent } = {}) {
  await db.query('INSERT INTO clicks (short_code, referrer, user_agent) VALUES ($1, $2, $3)', [
    shortCode,
    referrer ?? null,
    userAgent ?? null,
  ]);
}

module.exports = { recordClick };
