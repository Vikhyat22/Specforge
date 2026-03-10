const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connected');
  } catch (err) {
    console.error(err.message);
  }
})();

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { query, pool };
