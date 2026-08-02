const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Required because cloud proxies (like Render) don't pass public CA chain validation
    rejectUnauthorized: false,
  },
});

function query(text, params) {
  return pool.query(text, params);
}

module.exports = { query, pool };
