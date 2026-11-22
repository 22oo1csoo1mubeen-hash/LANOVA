import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ChatUserList from '../components/ChatUserList';
import ChatArea from '../components/ChatArea';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import '../styles/chat.css';

const EMPTY_MESSAGES = [];

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
    editedAt: msg.editedAt || null,
    deliveredAt: msg.deliveredAt || null,
    readAt: msg.readAt || null,
    deliveryStatus: msg.readAt ? 'read' : msg.deliveredAt ? 'delivered' : isMe ? 'sent' : null,
    replyTo: msg.replyTo || null,
    reactions: msg.reactions || [],
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
  const {
    isUserOnline,
    sendMessage,
    sendTypingStatus,
    markMessageDelivered,
    markConversationRead,
    isConnected,
    addMessageListener,
  } = useSocket();

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
  const [hasMoreHistory, setHasMoreHistory] = useState({});
  const [loadingOlderHistory, setLoadingOlderHistory] = useState({});
  const [historyPageVersions, setHistoryPageVersions] = useState({});
  const [conversationWallpapers, setConversationWallpapers] = useState({});
  const [typingUserIds, setTypingUserIds] = useState(new Set());
  const [isPageVisible, setIsPageVisible] = useState(
    () => typeof document !== 'undefined' && document.visibilityState === 'visible'
  );
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  );
  const typingTimeoutsRef = useRef(new Map());
  const loadingOlderUserIdsRef = useRef(new Set());
  const wallpaperVersionsRef = useRef(new Map());
  const lastReadRequestRef = useRef(null);

  useEffect(() => {
    const updateVisibility = () => setIsPageVisible(document.visibilityState === 'visible');
    const updateViewport = () => setIsMobileViewport(window.innerWidth <= 768);
    document.addEventListener('visibilitychange', updateVisibility);
    window.addEventListener('resize', updateViewport);
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

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
        const data = await api.get(`/api/messages/${selectedUserId}?limit=50`);
        if (isMounted && data?.messages) {
          const formatted = data.messages.map((m) => formatMessage(m, user?.id));
          setConversations((prev) => {
            const existing = prev[selectedUserId] || [];
            const merged = new Map(formatted.map((message) => [message.id, message]));
            existing.forEach((message) => merged.set(message.id, message));
            return {
              ...prev,
              [selectedUserId]: sortMessagesChronologically([...merged.values()]),
            };
          });
          setHasMoreHistory((prev) => ({
            ...prev,
            [selectedUserId]: Boolean(data.hasMore),
          }));
          const fetchedWallpaperVersion =
            data.wallpaperUpdatedAt || data.wallpaper?.updatedAt || null;
          const latestWallpaperVersion = wallpaperVersionsRef.current.get(selectedUserId);
          if (
            !latestWallpaperVersion ||
            (fetchedWallpaperVersion &&
              Date.parse(fetchedWallpaperVersion) >= Date.parse(latestWallpaperVersion))
          ) {
            if (fetchedWallpaperVersion) {
              wallpaperVersionsRef.current.set(selectedUserId, fetchedWallpaperVersion);
            }
            setConversationWallpapers((prev) => ({
              ...prev,
              [selectedUserId]: data.wallpaper || null,
            }));
          }
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
    const typingTimeouts = typingTimeoutsRef.current;
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
        markMessageDelivered(payload.id);
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
          setHasMoreHistory((prev) => ({ ...prev, [peerId]: false }));
        }
      } else if (type === 'conversation:wallpaper' && payload?.participantIds) {
        const peerId = payload.participantIds.find(
          (participantId) => participantId.toString() !== user?.id?.toString()
        );
        if (peerId) {
          const incomingVersion = payload.updatedAt || payload.wallpaper?.updatedAt;
          const latestVersion = wallpaperVersionsRef.current.get(peerId);
          if (
            !latestVersion ||
            !incomingVersion ||
            Date.parse(incomingVersion) >= Date.parse(latestVersion)
          ) {
            if (incomingVersion) wallpaperVersionsRef.current.set(peerId, incomingVersion);
            setConversationWallpapers((prev) => ({
              ...prev,
              [peerId]: payload.wallpaper || null,
            }));
          }
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
      } else if (type === 'message:updated' && payload) {
        const peerId = payload.senderId === user?.id ? payload.receiverId : payload.senderId;
        if (peerId) {
          setConversations((prev) => ({
            ...prev,
            [peerId]: (prev[peerId] || []).map((message) =>
              message.id === payload.id
                ? { ...message, text: payload.content, editedAt: payload.editedAt }
                : message
            ),
          }));
        }
      } else if (type === 'message:reaction' && payload) {
        const peerId = payload.senderId === user?.id ? payload.receiverId : payload.senderId;
        if (peerId) {
          setConversations((prev) => ({
            ...prev,
            [peerId]: (prev[peerId] || []).map((message) =>
              message.id === payload.messageId
                ? { ...message, reactions: payload.reactions }
                : message
            ),
          }));
        }
      } else if (type === 'messages:receipt' && payload) {
        const peerId = payload.senderId === user?.id ? payload.receiverId : payload.senderId;
        const messageIds = new Set(payload.messageIds || []);
        const receiptBoundaryId =
          payload.lastReadMessageId || payload.lastDeliveredMessageId || null;
        if (peerId && (messageIds.size > 0 || receiptBoundaryId)) {
          setConversations((prev) => {
            const messages = prev[peerId] || [];
            const receiptBoundaryIndex = receiptBoundaryId
              ? messages.findIndex((message) => message.id === receiptBoundaryId)
              : -1;
            const statusRank = { sent: 0, delivered: 1, read: 2 };
            return {
              ...prev,
              [peerId]: messages.map((message, index) => {
                const isCoveredByReceipt =
                  messageIds.has(message.id) ||
                  (receiptBoundaryIndex >= 0 &&
                    index <= receiptBoundaryIndex &&
                    message.sender === 'me');
                if (!isCoveredByReceipt) return message;
                const status =
                  (statusRank[payload.status] || 0) >=
                  (statusRank[message.deliveryStatus] || 0)
                    ? payload.status
                    : message.deliveryStatus;
                return {
                  ...message,
                  deliveryStatus: status,
                  deliveredAt: message.deliveredAt || payload.timestamp,
                  readAt: status === 'read' ? message.readAt || payload.timestamp : message.readAt,
                };
              }),
            };
          });
        }
      } else if (type === 'typing:start' && payload?.senderId) {
        const senderId = payload.senderId.toString();
        const existingTimeout = typingTimeouts.get(senderId);
        if (existingTimeout) clearTimeout(existingTimeout);
        setTypingUserIds((prev) => new Set(prev).add(senderId));
        const timeout = setTimeout(() => {
          setTypingUserIds((prev) => {
            const updated = new Set(prev);
            updated.delete(senderId);
            return updated;
          });
          typingTimeouts.delete(senderId);
        }, 5000);
        typingTimeouts.set(senderId, timeout);
      } else if (type === 'typing:stop' && payload?.senderId) {
        const senderId = payload.senderId.toString();
        const existingTimeout = typingTimeouts.get(senderId);
        if (existingTimeout) clearTimeout(existingTimeout);
        typingTimeouts.delete(senderId);
        setTypingUserIds((prev) => {
          const updated = new Set(prev);
          updated.delete(senderId);
          return updated;
        });
      }
    });

    return () => {
      removeListener();
      for (const timeout of typingTimeouts.values()) {
        clearTimeout(timeout);
      }
      typingTimeouts.clear();
    };
  }, [addMessageListener, markMessageDelivered, user?.id]);

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
    async (text, attachmentPayload = null, messageOptions = {}) => {
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
        replyTo: messageOptions.replyTo
          ? {
              messageId: messageOptions.replyTo.id,
              content: messageOptions.replyTo.content,
              senderId: messageOptions.replyTo.senderId,
            }
          : null,
        deliveryStatus: 'sent',
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
          replyToId: messageOptions.replyTo?.id || null,
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

  const handleEditMessage = useCallback(
    async (messageId, content) => {
      try {
        const data = await api.put(`/api/messages/item/${messageId}`, { content });
        const updated = data.message;
        setConversations((prev) => ({
          ...prev,
          [selectedUserId]: (prev[selectedUserId] || []).map((message) =>
            message.id === messageId
              ? { ...message, text: updated.content, editedAt: updated.editedAt }
              : message
          ),
        }));
        return true;
      } catch (err) {
        console.error('[ChatPage] Failed to edit message:', err.message);
        alert(`Failed to edit message: ${err.message}`);
        return false;
      }
    },
    [selectedUserId]
  );

  const handleToggleReaction = useCallback(
    async (messageId, emoji) => {
      try {
        const data = await api.post(`/api/messages/item/${messageId}/reactions`, { emoji });
        setConversations((prev) => ({
          ...prev,
          [selectedUserId]: (prev[selectedUserId] || []).map((message) =>
            message.id === messageId
              ? { ...message, reactions: data.reactions }
              : message
          ),
        }));
      } catch (err) {
        console.error('[ChatPage] Failed to update message reaction:', err.message);
        alert(`Failed to update reaction: ${err.message}`);
      }
    },
    [selectedUserId]
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
          const data = await api.get(`/api/messages/${selectedUserId}?limit=all`);
          if (data?.messages) {
            setConversations((prev) => ({
              ...prev,
              [selectedUserId]: data.messages.map((m) => formatMessage(m, user?.id)),
            }));
            setHasMoreHistory((prev) => ({ ...prev, [selectedUserId]: false }));
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
      setHasMoreHistory((prev) => ({ ...prev, [targetUserId]: false }));

      // 2. Delete messages permanently from MongoDB
      try {
        await api.del(`/api/messages/${targetUserId}`);
        setLoadedHistory((prev) => new Set(prev).add(targetUserId));
      } catch (err) {
        console.error('[ChatPage] Failed to clear conversation from database:', err.message);
        // Reload if delete failed
        try {
          const data = await api.get(`/api/messages/${targetUserId}?limit=all`);
          if (data?.messages) {
            setConversations((prev) => ({
              ...prev,
              [targetUserId]: data.messages.map((m) => formatMessage(m, user?.id)),
            }));
            setHasMoreHistory((prev) => ({ ...prev, [targetUserId]: false }));
          }
        } catch {}
        alert(`Failed to clear conversation: ${err.message}`);
      }
    },
    [user?.id]
  );

  const currentMessages = useMemo(
    () => conversations[selectedUser?.id] || EMPTY_MESSAGES,
    [conversations, selectedUser?.id]
  );
  const loadOlderHistory = useCallback(
    async (conversationUserId) => {
      if (
        !conversationUserId ||
        !hasMoreHistory[conversationUserId] ||
        loadingOlderUserIdsRef.current.has(conversationUserId)
      ) {
        return;
      }

      const currentList = conversations[conversationUserId] || [];
      const oldestMessage = currentList.find((message) => !message.id.startsWith('temp_'));
      if (!oldestMessage) return;

      loadingOlderUserIdsRef.current.add(conversationUserId);
      setLoadingOlderHistory((prev) => ({ ...prev, [conversationUserId]: true }));
      try {
        const data = await api.get(
          `/api/messages/${conversationUserId}?limit=50&before=${encodeURIComponent(oldestMessage.id)}`
        );
        const olderMessages = (data.messages || []).map((message) => formatMessage(message, user?.id));
        setConversations((prev) => {
          const merged = new Map(olderMessages.map((message) => [message.id, message]));
          (prev[conversationUserId] || []).forEach((message) => merged.set(message.id, message));
          return {
            ...prev,
            [conversationUserId]: sortMessagesChronologically([...merged.values()]),
          };
        });
        setHasMoreHistory((prev) => ({
          ...prev,
          [conversationUserId]: Boolean(data.hasMore),
        }));
        setHistoryPageVersions((prev) => ({
          ...prev,
          [conversationUserId]: (prev[conversationUserId] || 0) + 1,
        }));
      } catch (error) {
        console.error(`[ChatPage] Failed to load older messages for ${conversationUserId}:`, error);
        alert(`Could not load older messages: ${error.message}`);
      } finally {
        loadingOlderUserIdsRef.current.delete(conversationUserId);
        setLoadingOlderHistory((prev) => ({ ...prev, [conversationUserId]: false }));
      }
    },
    [conversations, hasMoreHistory, user?.id]
  );
  const setSharedWallpaper = useCallback(
    async (file) => {
      if (!selectedUserId || !file) return;
      const formData = new FormData();
      formData.append('image', file);
      const data = await api.upload(
        `/api/messages/${selectedUserId}/wallpaper`,
        formData,
        { method: 'PUT' }
      );
      if (data.wallpaperUpdatedAt) {
        wallpaperVersionsRef.current.set(selectedUserId, data.wallpaperUpdatedAt);
      }
      setConversationWallpapers((prev) => ({
        ...prev,
        [selectedUserId]: data.wallpaper,
      }));
    },
    [selectedUserId]
  );
  const removeSharedWallpaper = useCallback(async () => {
    if (!selectedUserId) return;
    const data = await api.del(`/api/messages/${selectedUserId}/wallpaper`);
    if (data.wallpaperUpdatedAt) {
      wallpaperVersionsRef.current.set(selectedUserId, data.wallpaperUpdatedAt);
    }
    setConversationWallpapers((prev) => ({
      ...prev,
      [selectedUserId]: null,
    }));
  }, [selectedUserId]);
  const lastUnreadIncomingMessage = useMemo(() => {
    for (let index = currentMessages.length - 1; index >= 0; index--) {
      const message = currentMessages[index];
      if (message.sender === 'other' && !message.readAt) return message;
    }
    return null;
  }, [currentMessages]);

  useEffect(() => {
    const canMarkRead =
      selectedUserId &&
      loadedHistory.has(selectedUserId) &&
      lastUnreadIncomingMessage &&
      isConnected &&
      isPageVisible &&
      (!isMobileViewport || mobileChatOpen);
    if (!canMarkRead) {
      lastReadRequestRef.current = null;
      return;
    }

    const requestKey = `${selectedUserId}:${lastUnreadIncomingMessage.id}`;
    if (lastReadRequestRef.current === requestKey) return;
    if (markConversationRead(selectedUserId, lastUnreadIncomingMessage.id)) {
      lastReadRequestRef.current = requestKey;
    }
  }, [
    isConnected,
    isMobileViewport,
    isPageVisible,
    loadedHistory,
    lastUnreadIncomingMessage,
    markConversationRead,
    mobileChatOpen,
    selectedUserId,
  ]);

  const handleTypingChange = useCallback(
    (receiverId, isTyping) => sendTypingStatus(receiverId, isTyping),
    [sendTypingStatus]
  );
  const isPeerTyping = selectedUser ? typingUserIds.has(selectedUser.id) : false;
  const loadSelectedOlderHistory = useCallback(
    () => loadOlderHistory(selectedUser?.id),
    [loadOlderHistory, selectedUser?.id]
  );

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
        key={`${user?.id || ''}-${selectedUser?.id || ''}`}
        selectedUser={selectedUser}
        messages={currentMessages}
        mobileChatOpen={mobileChatOpen}
        onSendMessage={handleSendMessage}
        onBack={handleBackToUsers}
        onClearConversation={handleClearConversation}
        onDeleteMessage={handleDeleteMessage}
        onEditMessage={handleEditMessage}
        onToggleReaction={handleToggleReaction}
        currentUserId={user?.id}
        onTypingChange={handleTypingChange}
        isPeerTyping={isPeerTyping}
        wallpaper={conversationWallpapers[selectedUser?.id] || null}
        onSetWallpaper={setSharedWallpaper}
        onRemoveWallpaper={removeSharedWallpaper}
        hasMoreHistory={Boolean(hasMoreHistory[selectedUser?.id])}
        isLoadingOlderHistory={Boolean(loadingOlderHistory[selectedUser?.id])}
        historyPageVersion={historyPageVersions[selectedUser?.id] || 0}
        onLoadOlderHistory={loadSelectedOlderHistory}
      />
    </div>
  );
}
