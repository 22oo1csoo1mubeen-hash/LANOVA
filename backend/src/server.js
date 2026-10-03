import 'dotenv/config';
import http from 'http';
import { app } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocketServer, closeSocketServer } from './sockets/socketServer.js';
import { getPrimaryLanIp } from './utils/networkUtils.js';

const PORT = parseInt(process.env.PORT, 10) || 5000;

// Create standard HTTP server
const server = http.createServer(app);

// Attach WebSocket server for Milestone 2 real-time chat
initSocketServer(server);

async function startServer() {
  try {
    // Connect to MongoDB before accepting traffic
    await connectDB();

    server.listen(PORT, '0.0.0.0', () => {
      const lanIp = getPrimaryLanIp();
      console.log('==================================================');
      console.log(`[LANOVA Server] Backend listening on port ${PORT} (0.0.0.0)`);
      console.log(`[LANOVA Server] Local HTTP:  http://localhost:${PORT}/api/health`);
      console.log(`[LANOVA Server] LAN HTTP:    http://${lanIp}:${PORT}/api/health`);
      console.log(`[LANOVA Server] Local WS:    ws://localhost:${PORT}/ws`);
      console.log(`[LANOVA Server] LAN WS:      ws://${lanIp}:${PORT}/ws`);
      console.log('==================================================');
    });
  } catch (error) {
    console.error('[LANOVA Server Fatal Error] Could not start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown handling
function handleShutdown(signal) {
  console.log(`\n[LANOVA Server] Received ${signal}. Shutting down gracefully...`);
  closeSocketServer();
  server.close(async () => {
    console.log('[LANOVA Server] HTTP server closed.');
    await disconnectDB();
    process.exit(0);
  });
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

startServer();
