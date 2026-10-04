import { WebSocketServer, WebSocket } from 'ws';
import { extractTokenFromRequest, verifySocketToken } from './socketAuth.js';
import { connectionManager } from './connectionManager.js';
import { handleSocketMessage } from './socketHandlers.js';

/**
 * Socket Server — LANOVA Milestone 2
 * Initializes and manages WebSocket connections attached to the Express HTTP server.
 */

let wss = null;
let heartbeatInterval = null;

export function initSocketServer(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  console.log('[LANOVA WebSocket] Server attached at path /ws');

  // Heartbeat / ping-pong every 10 seconds to rapidly clean up dead TCP sockets
  heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log('[LANOVA WebSocket] Terminating unresponsive client connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 10000);

  wss.on('connection', async (ws, req) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    let authenticatedUser = null;

    // 1. Check for token in upgrade request (URL query or headers)
    const token = extractTokenFromRequest(req);

    if (token) {
      try {
        authenticatedUser = await verifySocketToken(token);
        setupAuthenticatedSocket(ws, authenticatedUser);
      } catch (authError) {
        console.warn('[LANOVA WebSocket] Connection rejected: Invalid token:', authError.message);
        ws.close(4001, 'Authentication failed');
        return;
      }
    } else {
      // 2. First-message authentication fallback (5-second timeout window)
      const authTimeout = setTimeout(() => {
        if (!authenticatedUser) {
          console.warn('[LANOVA WebSocket] Connection closed: Auth timeout (no token provided)');
          ws.close(4001, 'Authentication timeout');
        }
      }, 5000);

      const firstMessageHandler = async (rawData) => {
        try {
          const parsed = JSON.parse(rawData.toString());
          if (parsed?.type === 'auth' && parsed?.payload?.token) {
            clearTimeout(authTimeout);
            ws.removeListener('message', firstMessageHandler);

            authenticatedUser = await verifySocketToken(parsed.payload.token);
            setupAuthenticatedSocket(ws, authenticatedUser);
          } else {
            clearTimeout(authTimeout);
            ws.close(4001, 'First message must be an auth event');
          }
        } catch (err) {
          clearTimeout(authTimeout);
          ws.close(4001, 'Authentication failed');
        }
      };

      ws.on('message', firstMessageHandler);
    }
  });

  return wss;
}

/**
 * Configure event listeners and active connection state for an authenticated socket.
 * @param {WebSocket} ws
 * @param {object} user - Authenticated User document
 */
function setupAuthenticatedSocket(ws, user) {
  const userId = user._id.toString();

  // Register in active connection manager
  const isFirstConnection = connectionManager.addConnection(userId, ws);

  console.log(`[LANOVA WebSocket] User connected: ${user.username} (${userId})`);

  // If user just came online, broadcast online status to all other users
  if (isFirstConnection) {
    connectionManager.broadcast(
      {
        type: 'user:status',
        payload: { userId, status: 'online' },
      },
      userId
    );
  }

  // Send current snapshot of all online users to this newly connected client
  connectionManager.send(ws, {
    type: 'users:online',
    payload: {
      onlineUserIds: connectionManager.getOnlineUserIds(),
    },
  });

  // Listen for application messages
  ws.on('message', (rawData) => {
    handleSocketMessage(ws, user, rawData);
  });

  // Handle socket closure
  ws.on('close', (code, reason) => {
    const { isLastConnection } = connectionManager.removeConnection(ws);
    console.log(
      `[LANOVA WebSocket] User disconnected: ${user.username} (${userId}) [code: ${code}, reason: ${reason.toString() || 'none'}]`
    );

    // If this was the user's final connection, broadcast offline status
    if (isLastConnection) {
      connectionManager.broadcast({
        type: 'user:status',
        payload: { userId, status: 'offline' },
      });
    }
  });

  // Handle socket errors
  ws.on('error', (err) => {
    console.error(`[LANOVA WebSocket] Socket error for user ${user.username}:`, err.message);
  });
}

/**
 * Gracefully close the WebSocket server and all active connections.
 */
export function closeSocketServer() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  if (wss) {
    wss.clients.forEach((client) => {
      client.close(1001, 'Server shutting down');
    });
    wss.close();
    console.log('[LANOVA WebSocket] Server closed.');
  }
}
