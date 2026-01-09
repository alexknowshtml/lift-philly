import { serve } from 'bun';
import { getDatabase, closeDatabase } from './db/client';
import app from './api/routes';

const PORT = parseInt(process.env.API_PORT || '3000', 10);
const HOST = process.env.API_HOST || '0.0.0.0';

// Catch unhandled errors to prevent silent failures
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Unhandled rejection at:', promise, 'reason:', reason);
});

console.log('Coalition Tracker starting...');

// Initialize database
console.log('Initializing database...');
getDatabase();

// Start the API server
console.log(`Starting API server on ${HOST}:${PORT}...`);
const server = serve({
  port: PORT,
  hostname: HOST,
  fetch: app.fetch,
});

console.log(`Coalition Tracker ready at http://${HOST}:${PORT}`);

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down...');
  closeDatabase();
  server.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
