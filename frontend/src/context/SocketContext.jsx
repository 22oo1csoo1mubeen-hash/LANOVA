import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getApiBaseUrl } from '../utils/api';

const SocketContext = createContext(null);

export function getWebSocketUrl(token) {
  const httpUrl = getApiBaseUrl();
  const wsProtocol = httpUrl.startsWith('https') ? 'wss:' : 'ws:';
  const host = httpUrl.replace(/^https?:\/\//, '');
  const baseWs = `${wsProtocol}//${host}/ws`;
  return token ? `${baseWs}?token=${encodeURIComponent(token)}` : baseWs;
}

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  const socketRef = useRef(null);
  const listenersRef = useRef(new Set());
  const reconnectTimeoutRef = useRef(null);
  const isExplicitCloseRef = useRef(false);

  // Subscribe to raw socket events
  const addMessageListener = useCallback((listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const connect = useCallback(() => {
    if (!token || !user) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = getWebSocketUrl(token);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;
      isExplicitCloseRef.current = false;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[LANOVA WebSocket] Connected to real-time messaging server');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          if (type === 'users:online' && payload?.onlineUserIds) {
            setOnlineUserIds(new Set(payload.onlineUserIds));
          } else if (type === 'user:status' && payload?.userId) {
            setOnlineUserIds((prev) => {
              const updated = new Set(prev);
              if (payload.status === 'online') {
                updated.add(payload.userId);
              } else {
                updated.delete(payload.userId);
              }
              return updated;
            });
          }

          // Forward to all registered listeners
          for (const listener of listenersRef.current) {
            listener(data);
          }
        } catch (err) {
          console.warn('[LANOVA WebSocket] Failed to parse incoming message:', err);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        console.log(`[LANOVA WebSocket] Connection closed (code: ${event.code})`);

        // Reconnect after 3 seconds if not intentionally closed and token still valid
        if (!isExplicitCloseRef.current && event.code !== 4001 && token) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        console.warn('[LANOVA WebSocket] Socket error:', err);
      };
    } catch (err) {
      console.error('[LANOVA WebSocket] Failed to initiate WebSocket connection:', err);
    }
  }, [token, user]);

  useEffect(() => {
    if (token && user) {
      connect();
    } else {
      isExplicitCloseRef.current = true;
      if (socketRef.current) {
        socketRef.current.close(1000, 'User logged out');
        socketRef.current = null;
      }
      setIsConnected(false);
      setOnlineUserIds(new Set());
    }

    // Immediately close socket when tab/window is closing or navigating away
    const handlePageHide = () => {
      isExplicitCloseRef.current = true;
      if (socketRef.current) {
        try {
          socketRef.current.close(1000, 'Browser tab closed');
          socketRef.current = null;
        } catch {}
      }
    };

    // Manage online/offline state when user minimizes browser, switches tabs, or locks mobile phone
    let hideTimer = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab hidden or phone locked / switched apps -> close connection after 1 second
        hideTimer = setTimeout(() => {
          if (socketRef.current) {
            isExplicitCloseRef.current = true;
            try {
              socketRef.current.close(1000, 'Tab hidden');
              socketRef.current = null;
            } catch {}
            setIsConnected(false);
          }
        }, 1000);
      } else if (document.visibilityState === 'visible') {
        // Tab returned to active foreground -> cancel hide timer and reconnect immediately
        if (hideTimer) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }
        if (token && user) {
          isExplicitCloseRef.current = false;
          if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            connect();
          }
        }
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isExplicitCloseRef.current = true;
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounted');
        socketRef.current = null;
      }
    };
  }, [token, user, connect]);

  const sendMessage = useCallback((receiverId, content) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection is not open. Unable to send message.');
    }

    const payload = {
      type: 'message:send',
      payload: {
        receiverId,
        content,
      },
    };

    socketRef.current.send(JSON.stringify(payload));
  }, []);

  const isUserOnline = useCallback(
    (userId) => {
      return onlineUserIds.has(userId?.toString());
    },
    [onlineUserIds]
  );

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        onlineUserIds,
        isUserOnline,
        sendMessage,
        addMessageListener,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
