import { useState, useEffect, useCallback, useMemo } from 'react';
import ChatUserList from '../components/ChatUserList';
import ChatArea from '../components/ChatArea';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import '../styles/chat.css';

/**
 * Format raw message object for display in ChatArea
 */
function formatMessage(msg, currentUserId) {
  const isMe =
    msg.sender === 'me' ||
    (currentUserId && msg.senderId?.toString() === currentUserId.toString());

  let timeStr = msg.time;
  if (!timeStr && msg.createdAt) {
    try {
      const date = new Date(msg.createdAt);
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      timeStr = `${formattedHours}:${minutes} ${ampm}`;
    } catch {
      timeStr = '';
    }
  }

  return {
    id: msg.id || msg._id || `msg_${Date.now()}_${Math.random()}`,
    sender: isMe ? 'me' : 'other',
    senderId: msg.senderId?.toString(),
    receiverId: msg.receiverId?.toString(),
    text: msg.content || msg.text || '',
    time: timeStr || 'Just now',
    createdAt: msg.createdAt,
    read: true,
  };
}

/**
 * ChatPage — Primary real-time messaging interface for LANOVA.
 * Milestone 2 Integration:
 * - Real-time WebSocket communication
 * - Message persistence & history retrieval
 * - Dynamic online/offline status updates
 */
export default function ChatPage() {
  const { user } = useAuth();
  const { isUserOnline, sendMessage, addMessageListener, isConnected } = useSocket();

  // Initialize state with sessionStorage persistence to maintain selected conversation across page navigation
  const [rawUsers, setRawUsers] = useState(() => {
    try {
      const cached = sessionStorage.getItem('lanova_users_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [selectedUserId, setSelectedUserId] = useState(() => {
    try {
      return sessionStorage.getItem('lanova_selected_user_id') || null;
    } catch {
      return null;
    }
  });

  const [conversations, setConversations] = useState({});
  const [loadedHistory, setLoadedHistory] = useState(new Set());

  // 1. Fetch registered users from GET /api/users
  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      try {
        const data = await api.get('/api/users');
        if (isMounted && data?.users) {
          setRawUsers(data.users);
          try {
            sessionStorage.setItem('lanova_users_cache', JSON.stringify(data.users));
          } catch {}

          if (data.users.length > 0) {
            setSelectedUserId((prev) => {
              // 1. Keep current selected user if present in freshly fetched list
              if (prev && data.users.some((u) => u.id === prev)) {
                return prev;
              }
              // 2. Check if a previously selected user was saved in sessionStorage
              try {
                const saved = sessionStorage.getItem('lanova_selected_user_id');
                if (saved && data.users.some((u) => u.id === saved)) {
                  return saved;
                }
              } catch {}
              // 3. Fallback to first user in list if no selection exists or previous user no longer exists
              const fallback = data.users[0].id;
              try {
                sessionStorage.setItem('lanova_selected_user_id', fallback);
              } catch {}
              return fallback;
            });
          }
        }
      } catch (err) {
        console.warn('[ChatPage] Could not load registered users:', err.message);
      }
    }
    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Derive users with real-time online status from SocketContext
  const users = useMemo(() => {
    return rawUsers.map((u) => ({
      id: u.id,
      username: u.username,
      avatar: true,
      status: isUserOnline(u.id) ? 'online' : 'offline',
      lastSeen: null,
    }));
  }, [rawUsers, isUserOnline]);

  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === selectedUserId) || users[0] || null;
  }, [users, selectedUserId]);

  // 3. Load message history when a conversation is opened
  useEffect(() => {
    if (!selectedUserId || loadedHistory.has(selectedUserId)) return;

    let isMounted = true;
    async function fetchHistory() {
      try {
        const data = await api.get(`/api/messages/${selectedUserId}`);
        if (isMounted && data?.messages) {
          const formatted = data.messages.map((m) => formatMessage(m, user?.id));
          setConversations((prev) => ({
            ...prev,
            [selectedUserId]: formatted,
          }));
          setLoadedHistory((prev) => new Set(prev).add(selectedUserId));
        }
      } catch (err) {
        console.warn(`[ChatPage] Failed to load history for user ${selectedUserId}:`, err.message);
      }
    }

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [selectedUserId, loadedHistory, user?.id]);

  // 4. Listen for real-time WebSocket events (incoming messages & send acks)
  useEffect(() => {
    const removeListener = addMessageListener((data) => {
      const { type, payload } = data;

      if (type === 'message:received' && payload) {
        // Incoming message from another user
        const otherUserId = payload.senderId;
        const formattedMsg = formatMessage(payload, user?.id);

        setConversations((prev) => {
          const currentList = prev[otherUserId] || [];
          // Prevent duplicates
          if (currentList.some((m) => m.id === formattedMsg.id)) {
            return prev;
          }
          return {
            ...prev,
            [otherUserId]: [...currentList, formattedMsg],
          };
        });
      } else if (type === 'message:sent' && payload) {
        // Confirmation that message was saved in MongoDB
        const otherUserId = payload.receiverId;
        const formattedMsg = formatMessage(payload, user?.id);

        setConversations((prev) => {
          const currentList = prev[otherUserId] || [];
          // Replace matching temporary optimistic message or append
          const tempIdx = currentList.findIndex(
            (m) => m.id.startsWith('temp_') && m.text === formattedMsg.text
          );

          if (tempIdx !== -1) {
            const updated = [...currentList];
            updated[tempIdx] = formattedMsg;
            return { ...prev, [otherUserId]: updated };
          }

          if (currentList.some((m) => m.id === formattedMsg.id)) {
            return prev;
          }

          return {
            ...prev,
            [otherUserId]: [...currentList, formattedMsg],
          };
        });
      }
    });

    return removeListener;
  }, [addMessageListener, user?.id]);

  const [mobileChatOpen, setMobileChatOpen] = useState(() => {
    try {
      return sessionStorage.getItem('lanova_mobile_chat_open') === 'true';
    } catch {
      return false;
    }
  });

  const handleSelectUser = useCallback((u) => {
    if (!u) return;
    setSelectedUserId(u.id);
    try {
      sessionStorage.setItem('lanova_selected_user_id', u.id);
      sessionStorage.setItem('lanova_mobile_chat_open', 'true');
    } catch {}
    setMobileChatOpen(true);
  }, []);

  const handleBackToUsers = useCallback(() => {
    setMobileChatOpen(false);
    try {
      sessionStorage.setItem('lanova_mobile_chat_open', 'false');
    } catch {}
  }, []);

  const handleSendMessage = useCallback(
    (text) => {
      if (!selectedUser || !text.trim()) return;

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const timeStr = `${formattedHours}:${minutes} ${ampm}`;

      // Optimistic message bubble
      const optimisticMsg = {
        id: `temp_${Date.now()}`,
        sender: 'me',
        senderId: user?.id,
        receiverId: selectedUser.id,
        text: text.trim(),
        time: timeStr,
        createdAt: now.toISOString(),
        read: true,
      };

      setConversations((prev) => {
        const currentList = prev[selectedUser.id] || [];
        return {
          ...prev,
          [selectedUser.id]: [...currentList, optimisticMsg],
        };
      });

      // Send over TCP WebSocket
      try {
        sendMessage(selectedUser.id, text.trim());
      } catch (err) {
        console.error('[ChatPage] Failed to send message via WebSocket:', err.message);
      }
    },
    [selectedUser, user?.id, sendMessage]
  );

  const handleClearConversation = useCallback((targetUserId) => {
    if (!targetUserId) return;
    setConversations((prev) => ({
      ...prev,
      [targetUserId]: [],
    }));
  }, []);

  const currentMessages = conversations[selectedUser?.id] || [];

  return (
    <div
      className={`chat-layout-grid${mobileChatOpen ? ' mobile-show-chat' : ' mobile-show-list'}`}
    >
      {/* Users list panel */}
      <ChatUserList
        users={users}
        selectedUser={selectedUser}
        onSelectUser={handleSelectUser}
        onClearConversation={handleClearConversation}
      />

      {/* Main Chat conversation area */}
      <ChatArea
        selectedUser={selectedUser}
        messages={currentMessages}
        onSendMessage={handleSendMessage}
        onBack={handleBackToUsers}
        onClearConversation={handleClearConversation}
      />
    </div>
  );
}
