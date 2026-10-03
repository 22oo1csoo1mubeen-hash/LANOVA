import { WebSocket } from 'ws';

/**
 * ConnectionManager — In-memory active WebSocket connection registry.
 * Maps authenticated user IDs to their active WebSocket connection(s).
 * Note: Does not persist sockets in MongoDB; this is runtime TCP state.
 */
class ConnectionManager {
  constructor() {
    // Map<userId: string, Set<WebSocket>>
    this.userSockets = new Map();
    // WeakMap<WebSocket, userId: string>
    this.socketToUser = new WeakMap();
  }

  /**
   * Register a new authenticated WebSocket connection for a user.
   * @param {string} userId
   * @param {WebSocket} ws
   * @returns {boolean} isFirstConnection (true if the user was previously offline)
   */
  addConnection(userId, ws) {
    const id = userId.toString();
    const existing = this.userSockets.get(id);
    const isFirstConnection = !existing || existing.size === 0;

    if (!existing) {
      this.userSockets.set(id, new Set([ws]));
    } else {
      existing.add(ws);
    }

    this.socketToUser.set(ws, id);
    return isFirstConnection;
  }

  /**
   * Remove a WebSocket connection on disconnect.
   * @param {WebSocket} ws
   * @returns {{ userId: string|null, isLastConnection: boolean }}
   */
  removeConnection(ws) {
    const userId = this.socketToUser.get(ws);
    if (!userId) {
      return { userId: null, isLastConnection: false };
    }

    const sockets = this.userSockets.get(userId);
    let isLastConnection = false;

    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
        isLastConnection = true;
      }
    }

    this.socketToUser.delete(ws);
    return { userId, isLastConnection };
  }

  /**
   * Get all active sockets for a given user.
   * @param {string} userId
   * @returns {WebSocket[]}
   */
  getSockets(userId) {
    const sockets = this.userSockets.get(userId.toString());
    return sockets ? Array.from(sockets) : [];
  }

  /**
   * Check if a user currently has at least one active connection.
   * @param {string} userId
   * @returns {boolean}
   */
  isUserOnline(userId) {
    const sockets = this.userSockets.get(userId.toString());
    return Boolean(sockets && sockets.size > 0);
  }

  /**
   * Get an array of all currently online user IDs.
   * @returns {string[]}
   */
  getOnlineUserIds() {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Send a JSON event to a specific WebSocket client safely.
   * @param {WebSocket} ws
   * @param {object} event
   */
  send(ws, event) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  /**
   * Send a JSON event to all active sockets belonging to a specific user.
   * @param {string} userId
   * @param {object} event
   */
  sendToUser(userId, event) {
    const sockets = this.getSockets(userId);
    const data = JSON.stringify(event);
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }

  /**
   * Broadcast an event to all connected users, optionally excluding a user.
   * @param {object} event
   * @param {string} [excludeUserId]
   */
  broadcast(event, excludeUserId = null) {
    const data = JSON.stringify(event);
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (excludeUserId && userId === excludeUserId.toString()) continue;
      for (const ws of sockets) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      }
    }
  }
}

export const connectionManager = new ConnectionManager();
