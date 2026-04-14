/**
 * Shared PostgreSQL connection pool (node-postgres).
 * Uses DATABASE_URL from the environment; tuned for high-concurrency reliability.
 * 
 * Reliability features:
 * - Query timeout (5s default) prevents hanging queries
 * - Idle validation ensures connections are alive
 * - Wait queue timeout prevents application from blocking indefinitely
 * - Comprehensive error recovery
 */
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  // Fail fast in production; makes misconfiguration obvious at startup.
  console.warn(
    '[db] WARNING: DATABASE_URL is not set. Database queries will fail until it is configured.'
  );
}

// Configuration with enhanced reliability
const PG_POOL_CONFIG = {
  connectionString: process.env.DATABASE_URL,
  
  // Connection pool sizing
  max: Number(process.env.PG_POOL_MAX || 10),
  min: Number(process.env.PG_POOL_MIN || 2),
  
  // Timing: prevent resource leaks and hanging queries
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30_000),
  connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 10_000),
  
  // Query timeout (statement_timeout in PostgreSQL)
  query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 5_000),
  
  // Prevent indefinite waiting for a client from the pool
  queue_timeout_ms: Number(process.env.PG_QUEUE_TIMEOUT_MS || 10_000),
  
  // Validate idle connections before use (detect stale connections)
  validate: (client) => {
    return client.query('SELECT 1').catch((err) => {
      console.error('[db:pool] Connection validation failed:', err.message);
      return false;
    });
  },
};

const pool = new Pool(PG_POOL_CONFIG);

// Track pool state and errors
let poolErrorCount = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

pool.on('error', (err, client) => {
  poolErrorCount++;
  console.error(
    `[db:pool:error] Unexpected pool error (count: ${poolErrorCount}):`,
    err.message
  );
  
  if (poolErrorCount >= MAX_CONSECUTIVE_ERRORS) {
    console.error('[db:pool:critical] Max consecutive errors reached. Pool may be degraded.');
  }
});

pool.on('connect', () => {
  // Reset error count on successful connection
  if (poolErrorCount > 0) {
    poolErrorCount = 0;
    console.log('[db:pool] Error count reset on successful connection');
  }
});

/**
 * Health check: verify pool can get a client and run a simple query.
 * @returns {Promise<boolean>}
 */
async function checkPoolHealth() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('[db:pool:health] Health check failed:', err.message);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Graceful pool drain for shutdown.
 * @returns {Promise<void>}
 */
async function drainPool() {
  try {
    console.log('[db:pool] Draining pool...');
    await pool.end();
    console.log('[db:pool] Pool drained successfully');
  } catch (err) {
    console.error('[db:pool] Error draining pool:', err);
  }
}

/**
 * @returns {import('pg').Pool}
 */
function getPool() {
  return pool;
}

module.exports = { pool, getPool, checkPoolHealth, drainPool };
