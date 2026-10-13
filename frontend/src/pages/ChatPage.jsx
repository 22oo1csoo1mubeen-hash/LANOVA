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

  let timeStr = '';
  if (msg.createdAt) {
    try {
      const date = new Date(msg.createdAt);
      if (!isNaN(date.getTime())) {
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        timeStr = `${formattedHours}:${minutes} ${ampm}`;
      }
    } catch {
      timeStr = '';
    }
  }
  if (!timeStr && msg.time) {
    timeStr = msg.time;
  }

  const messageType =
    msg.messageType || (msg.fileUrl ? 'file' : msg.imageUrl ? 'image' : 'text');

  return {
    id: msg.id || msg._id || `msg_${Date.now()}_${Math.random()}`,
    sender: isMe ? 'me' : 'other',
    senderId: msg.senderId?.toString(),
    receiverId: msg.receiverId?.toString(),
    text: msg.content || msg.text || '',
    messageType,
    imageUrl: msg.imageUrl || null,
    imageMeta: msg.imageMeta || null,
    fileUrl: msg.fileUrl || null,
    fileMeta: msg.fileMeta || null,
    time: timeStr || 'Just now',
    createdAt: msg.createdAt || new Date().toISOString(),
    read: true,
  };
}

/**
 * Sorts messages strictly in ascending chronological order
 */
function sortMessagesChronologically(list) {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
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
  const { isUserOnline, sendMessage, addMessageListener } = useSocket();

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
            [selectedUserId]: sortMessagesChronologically(formatted),
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
            [otherUserId]: sortMessagesChronologically([...currentList, formattedMsg]),
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
            (m) =>
              m.id.startsWith('temp_') &&
              ((formattedMsg.fileUrl && m.messageType === 'file') ||
                (formattedMsg.imageUrl && m.messageType === 'image') ||
                m.text === formattedMsg.text)
          );

          if (tempIdx !== -1) {
            const updated = [...currentList];
            updated[tempIdx] = formattedMsg;
            return { ...prev, [otherUserId]: sortMessagesChronologically(updated) };
          }

          if (currentList.some((m) => m.id === formattedMsg.id)) {
            return prev;
          }

          return {
            ...prev,
            [otherUserId]: sortMessagesChronologically([...currentList, formattedMsg]),
          };
        });
      } else if (type === 'conversation:cleared' && payload) {
        // Peer cleared conversation with current user in real time
        const { clearedByUserId, targetUserId } = payload;
        const peerId = clearedByUserId === user?.id ? targetUserId : clearedByUserId;
        if (peerId) {
          setConversations((prev) => ({
            ...prev,
            [peerId]: [],
          }));
        }
      } else if (type === 'message:deleted' && payload) {
        // Individual message deleted in real time
        const { messageId, peerId } = payload;
        if (peerId && messageId) {
          setConversations((prev) => {
            const currentList = prev[peerId] || [];
            return {
              ...prev,
              [peerId]: currentList.filter((m) => m.id !== messageId),
            };
          });
        }
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
    async (text, attachmentPayload = null) => {
      if (!selectedUser) return;
      const trimmedText = typeof text === 'string' ? text.trim() : '';
      if (!trimmedText && !attachmentPayload) return;

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const timeStr = `${formattedHours}:${minutes} ${ampm}`;

      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const isFile = attachmentPayload?.type === 'file';
      const isImage = attachmentPayload?.type === 'image';

      // Optimistic message bubble
      const optimisticMsg = {
        id: tempId,
        sender: 'me',
        senderId: user?.id,
        receiverId: selectedUser.id,
        text: trimmedText,
        messageType: isFile ? 'file' : isImage ? 'image' : 'text',
        imageUrl: isImage ? (attachmentPayload?.previewUrl || attachmentPayload?.imageUrl || null) : null,
        imageMeta: isImage ? (attachmentPayload?.imageMeta || null) : null,
        fileUrl: isFile ? (attachmentPayload?.fileUrl || null) : null,
        fileMeta: isFile ? (attachmentPayload?.fileMeta || null) : null,
        time: timeStr,
        createdAt: now.toISOString(),
        read: true,
      };

      setConversations((prev) => {
        const currentList = prev[selectedUser.id] || [];
        return {
          ...prev,
          [selectedUser.id]: sortMessagesChronologically([...currentList, optimisticMsg]),
        };
      });

      // Send over TCP WebSocket (with file/image upload first if attachment is staged)
      try {
        let finalImageUrl = isImage ? (attachmentPayload?.imageUrl || null) : null;
        let finalImageMeta = isImage ? (attachmentPayload?.imageMeta || null) : null;
        let finalFileUrl = isFile ? (attachmentPayload?.fileUrl || null) : null;
        let finalFileMeta = isFile ? (attachmentPayload?.fileMeta || null) : null;

        if (attachmentPayload?.file) {
          const formData = new FormData();
          if (isImage) {
            formData.append('image', attachmentPayload.file);
            const uploadRes = await api.upload('/api/messages/upload', formData);
            finalImageUrl = uploadRes.imageUrl;
            finalImageMeta = uploadRes.imageMeta;
          } else {
            formData.append('file', attachmentPayload.file);
            const uploadRes = await api.upload('/api/messages/upload-file', formData);
            finalFileUrl = uploadRes.fileUrl;
            finalFileMeta = uploadRes.fileMeta;
          }
        }

        const resolvedType = finalFileUrl ? 'file' : finalImageUrl ? 'image' : 'text';

        sendMessage(selectedUser.id, trimmedText, {
          messageType: resolvedType,
          imageUrl: finalImageUrl,
          imageMeta: finalImageMeta,
          fileUrl: finalFileUrl,
          fileMeta: finalFileMeta,
        });
      } catch (err) {
        console.error('[ChatPage] Failed to send message:', err.message);
        // Rollback optimistic message if upload/sending failed
        setConversations((prev) => {
          const currentList = prev[selectedUser.id] || [];
          return {
            ...prev,
            [selectedUser.id]: currentList.filter((m) => m.id !== tempId),
          };
        });
        alert(`Failed to send message: ${err.message}`);
      }
    },
    [selectedUser, user?.id, sendMessage]
  );

  const handleDeleteMessage = useCallback(
    async (messageId) => {
      if (!selectedUserId || !messageId) return;

      // Optimistically remove from state
      setConversations((prev) => {
        const currentList = prev[selectedUserId] || [];
        return {
          ...prev,
          [selectedUserId]: currentList.filter((m) => m.id !== messageId),
        };
      });

      // If temporary optimistic message, no backend call needed
      if (messageId.startsWith('temp_')) return;

      try {
        await api.del(`/api/messages/item/${messageId}`);
      } catch (err) {
        console.error('[ChatPage] Failed to delete message:', err.message);
        // Reload history if delete failed
        try {
          const data = await api.get(`/api/messages/${selectedUserId}`);
          if (data?.messages) {
            setConversations((prev) => ({
              ...prev,
              [selectedUserId]: data.messages.map((m) => formatMessage(m, user?.id)),
            }));
          }
        } catch {}
        alert(`Failed to delete message: ${err.message}`);
      }
    },
    [selectedUserId, user?.id]
  );

  const handleClearConversation = useCallback(
    async (targetUserId) => {
      if (!targetUserId) return;

      // 1. Immediately clear messages in UI
      setConversations((prev) => ({
        ...prev,
        [targetUserId]: [],
      }));

      // 2. Delete messages permanently from MongoDB
      try {
        await api.del(`/api/messages/${targetUserId}`);
        setLoadedHistory((prev) => new Set(prev).add(targetUserId));
      } catch (err) {
        console.error('[ChatPage] Failed to clear conversation from database:', err.message);
        // Reload if delete failed
        try {
          const data = await api.get(`/api/messages/${targetUserId}`);
          if (data?.messages) {
            setConversations((prev) => ({
              ...prev,
              [targetUserId]: data.messages.map((m) => formatMessage(m, user?.id)),
            }));
          }
        } catch {}
        alert(`Failed to clear conversation: ${err.message}`);
      }
    },
    [user?.id]
  );

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
        onDeleteMessage={handleDeleteMessage}
      />
    </div>
  );
}
