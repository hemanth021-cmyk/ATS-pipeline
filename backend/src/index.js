/**
 * ATS Pipeline API — process entry: create app, decay scheduler, HTTP server.
 */
require('dotenv').config();

const { createApp } = require('./app');
const { drainPool } = require('./db/pool');
const { startDecayScheduler, stopDecayScheduler } = require('./services/decayScheduler');

const app = createApp();
const PORT = Number(process.env.PORT || 3000);

if (process.env.DISABLE_DECAY_SCHEDULER !== 'true') {
  startDecayScheduler();
}

const server = app.listen(PORT, () => {
  console.log(`ATS Pipeline API listening on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`Received ${signal}, closing HTTP server and DB pool...`);
  stopDecayScheduler();
  server.close(async () => {
    await drainPool();
    process.exit(0);
  });
  
  // Force exit after 30 seconds
  setTimeout(() => {
    console.error('[shutdown] Forced exit after 30s timeout');
    process.exit(1);
  }, 30_000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
