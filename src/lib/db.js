const { Pool } = require('pg');

// DB_SSL opts in to SSL (needed for managed providers like Render, whose
// proxy doesn't pass public CA chain validation) — off by default since a
// local/Docker Compose Postgres doesn't support SSL at all.
const useSsl = process.env.DB_SSL === 'true';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

function query(text, params) {
  return pool.query(text, params);
}

module.exports = { query, pool };
