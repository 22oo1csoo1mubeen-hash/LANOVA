import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  MoreVertical,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Send,
  CheckCheck,
  ArrowLeft,
  X,
  ChevronUp,
  ChevronDown,
  ArrowDown,
  User,
  Download,
  Trash2,
  Bell,
  BellOff,
  UploadCloud,
  Maximize2,
  File,
  FileText,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileAudio,
  FileVideo,
  Reply,
  Pencil,
  Check,
} from 'lucide-react';
import Avatar from './Avatar';
import EmojiPicker from './EmojiPicker';
import UserInfoModal from './UserInfoModal';
import ConfirmModal from './ConfirmModal';
import { api, getMediaUrl } from '../utils/api';

/**
 * Returns icon, color, and descriptive metadata for any shared file extension
 */
function getFileInfo(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return { Icon: File, color: '#94a3b8', label: 'File', ext: 'FILE' };
  }
  const parts = fileName.split('.');
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';

  if (ext === 'pdf') {
    return { Icon: FileText, color: '#ef4444', label: 'PDF Document', ext: 'PDF' };
  }
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
    return { Icon: FileText, color: '#3b82f6', label: 'Word Document', ext: ext.toUpperCase() };
  }
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
    return { Icon: FileSpreadsheet, color: '#10b981', label: 'Spreadsheet', ext: ext.toUpperCase() };
  }
  if (['ppt', 'pptx', 'odp'].includes(ext)) {
    return { Icon: FileText, color: '#f59e0b', label: 'Presentation', ext: ext.toUpperCase() };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
    return { Icon: FileArchive, color: '#a855f7', label: 'Archive', ext: ext.toUpperCase() };
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext)) {
    return { Icon: FileAudio, color: '#06b6d4', label: 'Audio', ext: ext.toUpperCase() };
  }
  if (['mp4', 'mkv', 'webm', 'mov', 'avi', 'flv'].includes(ext)) {
    return { Icon: FileVideo, color: '#8b5cf6', label: 'Video', ext: ext.toUpperCase() };
  }
  if (
    [
      'js',
      'jsx',
      'ts',
      'tsx',
      'html',
      'css',
      'py',
      'java',
      'c',
      'cpp',
      'json',
      'xml',
      'sql',
      'sh',
      'md',
    ].includes(ext)
  ) {
    return { Icon: FileCode, color: '#eab308', label: 'Code File', ext: ext.toUpperCase() };
  }
  return {
    Icon: File,
    color: '#94a3b8',
    label: ext ? `${ext.toUpperCase()} File` : 'File',
    ext: ext ? ext.toUpperCase().slice(0, 5) : 'FILE',
  };
}

/**
 * Formats a message timestamp into a friendly human-readable date group header (WhatsApp style):
 * - "Today" if message was sent today
 * - "Yesterday" if message was sent yesterday
 * - Exact date (e.g. "12 October 2026") for past dates
 */
function formatChatDateDivider(dateStr) {
  if (!dateStr) return 'Today';
  const messageDate = new Date(dateStr);
  if (isNaN(messageDate.getTime())) return 'Today';

  const now = new Date();

  // Normalize both dates to midnight local time for accurate calendar day comparison
  const msgMidnight = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((todayMidnight.getTime() - msgMidnight.getTime()) / msPerDay);

  if (diffDays <= 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }

  // Exact calendar date: e.g. "12 October 2026"
  return messageDate.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Returns a unique local calendar day key (YYYY-MM-DD) for grouping
 */
function getMessageDateKey(dateStr) {
  if (!dateStr) return 'today';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'today';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function renderLinkedText(text) {
  const linkPattern =
    /https?:\/\/[^\s<]+|www\.[^\s<]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<]*)?/gi;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkPattern.exec(text)) !== null) {
    let visibleUrl = match[0];
    let trailing = '';
    while (/[.,!?;:)\]}]$/.test(visibleUrl)) {
      trailing = visibleUrl.slice(-1) + trailing;
      visibleUrl = visibleUrl.slice(0, -1);
    }

    if (!visibleUrl) continue;
    parts.push(text.slice(lastIndex, match.index));
    const href = /^https?:\/\//i.test(visibleUrl) ? visibleUrl : `https://${visibleUrl}`;
    let safeUrl;
    try {
      const parsed = new URL(href);
      safeUrl = parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
    } catch {
      safeUrl = null;
    }
    parts.push(
      safeUrl ? (
        <a key={`${match.index}-${visibleUrl}`} href={safeUrl} target="_blank" rel="noopener noreferrer">
          {visibleUrl}
        </a>
      ) : (
        visibleUrl
      )
    );
    parts.push(trailing);
    lastIndex = match.index + match[0].length;
  }

  parts.push(text.slice(lastIndex));
  return parts;
}

/**
 * ChatArea — central conversation panel.
 * Contains the conversation header with search & more options,
 * scrollable message bubbles with search highlight,
 * interactive emoji picker, image attachments, generic file sharing, lightbox viewer,
 * and the message composer with drag & drop + paste support.
 */
export default function ChatArea({
  selectedUser,
  messages,
  mobileChatOpen = false,
  onSendMessage,
  onBack,
  onClearConversation,
  onDeleteMessage,
  onEditMessage,
  onToggleReaction,
  currentUserId,
  onTypingChange,
  isPeerTyping = false,
  wallpaper,
  onSetWallpaper,
  onRemoveWallpaper,
  hasMoreHistory = false,
  isLoadingOlderHistory = false,
  historyPageVersion = 0,
  onLoadOlderHistory,
}) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Staged image for upload & preview
  const [stagedImage, setStagedImage] = useState(null);
  // Staged generic file (any extension like WhatsApp)
  const [stagedFile, setStagedFile] = useState(null);

  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Search in conversation state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  // More options menu & modal state
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [confirmDeleteMsgId, setConfirmDeleteMsgId] = useState(null);
  const [isWallpaperUpdating, setIsWallpaperUpdating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeMessageActionsId, setActiveMessageActionsId] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const wallpaperInputRef = useRef(null);
  const menuRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const typingStopTimeoutRef = useRef(null);
  const typingReceiverRef = useRef(null);
  const touchStartRef = useRef(null);
  const didLongPressRef = useRef(false);
  const cursorPosRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevMessagesCountRef = useRef(0);
  const prevSelectedUserIdRef = useRef(null);
  const prevMobileOpenRef = useRef(mobileChatOpen);
  const prevHistoryPageVersionRef = useRef(historyPageVersion);
  const prevOlderLoadingRef = useRef(isLoadingOlderHistory);
  const pendingHistoryScrollRef = useRef(null);

  const stopTyping = useCallback(() => {
    clearTimeout(typingStopTimeoutRef.current);
    if (typingReceiverRef.current) {
      onTypingChange?.(typingReceiverRef.current, false);
      typingReceiverRef.current = null;
    }
  }, [onTypingChange]);

  useEffect(() => () => clearTimeout(longPressTimerRef.current), []);
  useEffect(() => () => stopTyping(), [stopTyping]);

  // Close more menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      window.addEventListener('click', handleOutsideClick);
      return () => window.removeEventListener('click', handleOutsideClick);
    }
  }, [showMoreMenu]);

  // Ensure messages are strictly sorted chronologically
  const sortedMessages = useMemo(() => {
    if (!Array.isArray(messages)) return [];
    return [...messages].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });
  }, [messages]);

  // Group sorted messages by calendar date for WhatsApp-style date sections
  const messageDateGroups = useMemo(() => {
    if (!sortedMessages.length) return [];
    const groups = [];
    let currentGroup = null;

    for (const msg of sortedMessages) {
      const dateKey = getMessageDateKey(msg.createdAt);
      if (!currentGroup || currentGroup.dateKey !== dateKey) {
        currentGroup = {
          dateKey,
          label: formatChatDateDivider(msg.createdAt),
          messages: [],
        };
        groups.push(currentGroup);
      }
      currentGroup.messages.push(msg);
    }

    return groups;
  }, [sortedMessages]);

  // Compute matched message IDs for in-conversation search
  const matchedMessageIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return sortedMessages
      .filter((m) => m.text?.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [sortedMessages, searchQuery]);

  const handlePrevMatch = () => {
    if (matchedMessageIds.length === 0) return;
    setActiveMatchIndex((prev) =>
      prev <= 0 ? matchedMessageIds.length - 1 : prev - 1
    );
  };

  const handleNextMatch = () => {
    if (matchedMessageIds.length === 0) return;
    setActiveMatchIndex((prev) =>
      prev >= matchedMessageIds.length - 1 ? 0 : prev + 1
    );
  };

  // Scroll to active matched message
  useEffect(() => {
    if (matchedMessageIds.length > 0 && matchedMessageIds[activeMatchIndex]) {
      const targetId = matchedMessageIds[activeMatchIndex];
      const el = document.getElementById(`msg-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeMatchIndex, matchedMessageIds]);

  // Export current conversation transcript to a text file
  const handleExportChat = async () => {
    if (!selectedUser?.id) return;
    try {
      const { messages: allMessages } = await api.get(
        `/api/messages/${selectedUser.id}?limit=all`
      );
      if (!allMessages?.length) {
        alert('No messages to export in this conversation.');
        return;
      }

      const transcript = allMessages
        .map((message) => {
          const senderName =
            message.senderId?.toString() === currentUserId?.toString()
              ? 'You'
              : selectedUser.username || 'Peer';
          const time = message.createdAt
            ? new Date(message.createdAt).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })
            : '';
          const content =
            message.content ||
            (message.fileUrl ? '[File attachment]' : message.imageUrl ? '[Image]' : '');
          return `[${formatChatDateDivider(message.createdAt)} ${time}] ${senderName}: ${content}`;
        })
        .join('\n');
      const header = `========================================\nLANOVA Chat Transcript with ${selectedUser.username || 'Peer'}\nExported: ${new Date().toLocaleString()}\nTotal Messages: ${allMessages.length}\n========================================\n\n`;
      const blob = new Blob([header + transcript], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lanova-chat-${selectedUser.username || 'conversation'}-${Date.now()}.txt`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('[ChatArea] Could not export complete conversation:', error);
      alert(`Could not export this conversation: ${error.message}`);
    }
  };

  // Clear conversation history
  const handleClearChat = () => {
    setShowMoreMenu(false);
    if (!selectedUser) return;
    setShowClearConfirm(true);
  };

  const handleConfirmClear = () => {
    if (onClearConversation && selectedUser) {
      onClearConversation(selectedUser.id);
    }
  };

  const handleReplyToMessage = (msg) => {
    setReplyToMessage({
      id: msg.id,
      content: msg.text || (msg.imageUrl ? 'Photo' : 'File'),
      senderId: msg.senderId,
    });
    setEditingMessage(null);
    setInputText('');
    setActiveMessageActionsId(null);
    inputRef.current?.focus();
  };

  const handleEditThisMessage = (msg) => {
    setEditingMessage(msg);
    setReplyToMessage(null);
    setInputText(msg.text || '');
    setActiveMessageActionsId(null);
    inputRef.current?.focus();
  };

  const handleWallpaperSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selectedUser?.id) return;
    if (!file.type.startsWith('image/')) {
      alert('Choose an image file for the chat wallpaper.');
      return;
    }

    setIsWallpaperUpdating(true);
    try {
      await onSetWallpaper?.(file);
    } catch (error) {
      console.error('[ChatArea] Could not save chat wallpaper:', error);
      alert(`Could not save this wallpaper: ${error.message}`);
    } finally {
      setIsWallpaperUpdating(false);
    }
  };

  const handleRemoveWallpaper = async () => {
    if (!selectedUser?.id) return;
    setIsWallpaperUpdating(true);
    try {
      await onRemoveWallpaper?.();
    } catch (error) {
      console.error('[ChatArea] Could not remove chat wallpaper:', error);
      alert(`Could not remove this wallpaper: ${error.message}`);
    } finally {
      setIsWallpaperUpdating(false);
    }
    setShowMoreMenu(false);
  };

  const handleMessageTouchStart = (event, msg) => {
    if (msg.id.startsWith('temp_') || event.target.closest('a, button')) return;
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, message: msg };
    didLongPressRef.current = false;
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      setActiveMessageActionsId(msg.id);
      if (navigator.vibrate) navigator.vibrate(25);
    }, 500);
  };

  const handleMessageTouchMove = (event) => {
    if (!touchStartRef.current) return;
    const touch = event.touches[0];
    const distance = Math.hypot(
      touch.clientX - touchStartRef.current.x,
      touch.clientY - touchStartRef.current.y
    );
    if (distance > 12) clearTimeout(longPressTimerRef.current);
  };

  const handleMessageTouchEnd = (event) => {
    clearTimeout(longPressTimerRef.current);
    if (!touchStartRef.current) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    if (!didLongPressRef.current && Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      handleReplyToMessage(touchStartRef.current.message);
    }
    touchStartRef.current = null;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const clearStagedFile = useCallback(() => {
    setStagedFile(null);
  }, []);

  const clearStagedImage = useCallback(() => {
    setStagedImage((prev) => {
      if (prev?.previewUrl?.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(prev.previewUrl);
        } catch {}
      }
      return null;
    });
  }, []);

  const stageImageFile = useCallback(
    (file) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        alert('Only image files (PNG, JPG, GIF, WebP, SVG, BMP) can be shared as photos.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file size exceeds the 10MB limit.');
        return;
      }
      clearStagedFile();
      const previewUrl = URL.createObjectURL(file);
      setStagedImage({
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        sizeStr: formatFileSize(file.size),
      });
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [clearStagedFile]
  );

  const stageGenericFile = useCallback(
    (file) => {
      if (!file) return;
      if (file.size > 100 * 1024 * 1024) {
        alert('File size exceeds the 100MB limit for LAN sharing.');
        return;
      }
      clearStagedImage();
      const info = getFileInfo(file.name);
      setStagedFile({
        file,
        name: file.name,
        size: file.size,
        sizeStr: formatFileSize(file.size),
        info,
      });
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [clearStagedImage]
  );

  // Download file locally to user's device
  const handleDownloadFile = useCallback(async (url, fileName) => {
    if (!url) return;
    const downloadName = fileName || 'download';
    try {
      // Append download=1 query parameters to signal attachment download to server
      const sep = url.includes('?') ? '&' : '?';
      const downloadParamUrl = `${url}${sep}download=1&name=${encodeURIComponent(downloadName)}`;

      const response = await fetch(downloadParamUrl);
      if (!response.ok) {
        if (response.status === 404) {
          alert('This file is no longer available on the server (it may have expired or been removed).');
          return;
        }
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 2000);
    } catch (err) {
      console.warn('Download error:', err);
      alert('Unable to download file. Please check your network connection or try again.');
    }
  }, []);

  // Open file in browser tab for viewing
  const handleOpenFile = useCallback(async (url) => {
    if (!url) return;
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.status === 404) {
        alert('This file is no longer available on the server (it may have expired or been removed).');
        return;
      }
    } catch {
      // If HEAD check fails (e.g. offline/CORS), proceed to attempt opening
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  // Handle attachment file selection (routes images to stageImageFile and all other extensions to stageGenericFile)
  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      stageImageFile(file);
    } else {
      stageGenericFile(file);
    }
    e.target.value = '';
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        stageImageFile(file);
      } else {
        stageGenericFile(file);
      }
    }
  };

  // Clipboard paste handler (Ctrl+V with image screenshot)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          stageImageFile(file);
          break;
        }
      }
    }
  };

  // Close Lightbox on ESC
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setActiveLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Direct scroll to bottom (auto = instant jump, smooth = animated scroll)
  const scrollToBottom = useCallback((behavior = 'auto') => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (behavior === 'smooth') {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // Multi-pass scroll down to guarantee bottom position after browser layout reflows and dynamic media render
  const forceScrollToBottom = useCallback((behavior = 'auto') => {
    const container = messagesContainerRef.current;
    if (!container) return;

    scrollToBottom(behavior);

    requestAnimationFrame(() => {
      scrollToBottom(behavior);
      setTimeout(() => scrollToBottom(behavior), 50);
      setTimeout(() => scrollToBottom(behavior), 150);
      setTimeout(() => scrollToBottom(behavior), 300);
    });
  }, [scrollToBottom]);

  // 1. Whenever a chat is opened (switching conversation or opening on mobile/laptop):
  // Instantly open at the most recent messages so the user doesn't need to scroll down
  useEffect(() => {
    if (selectedUser?.id) {
      const isMobile = window.innerWidth <= 768;
      if (!isMobile || mobileChatOpen) {
        forceScrollToBottom('auto');
      }
    }
  }, [selectedUser?.id, mobileChatOpen, forceScrollToBottom]);

  // 2. React to messages update, new incoming/outgoing messages, or history loading
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    const currentCount = sortedMessages.length;
    const prevCount = prevMessagesCountRef.current;
    const userChanged = prevSelectedUserIdRef.current !== selectedUser?.id;
    const mobileOpened = !prevMobileOpenRef.current && mobileChatOpen;
    const olderPageLoaded = prevHistoryPageVersionRef.current !== historyPageVersion;
    const loadingFinished = prevOlderLoadingRef.current && !isLoadingOlderHistory;

    prevMessagesCountRef.current = currentCount;
    prevSelectedUserIdRef.current = selectedUser?.id;
    prevMobileOpenRef.current = mobileChatOpen;
    prevHistoryPageVersionRef.current = historyPageVersion;
    prevOlderLoadingRef.current = isLoadingOlderHistory;

    if (olderPageLoaded && pendingHistoryScrollRef.current) {
      const previousPosition = pendingHistoryScrollRef.current;
      pendingHistoryScrollRef.current = null;
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop =
            previousPosition.scrollTop + container.scrollHeight - previousPosition.scrollHeight;
        }
      });
      return;
    }

    if (loadingFinished) pendingHistoryScrollRef.current = null;

    if (searchQuery.trim()) {
      return;
    }

    // When chat is first opened, switched user, or history finishes loading:
    // Jump immediately to the most recent chat messages
    if (userChanged || mobileOpened || (prevCount === 0 && currentCount > 0)) {
      forceScrollToBottom('auto');
      return;
    }

    // When a new message arrives:
    if (currentCount > prevCount) {
      const lastMsg = sortedMessages[currentCount - 1];
      if (lastMsg?.sender === 'me') {
        // Current user sent the message: always scroll down smoothly
        forceScrollToBottom('smooth');
      } else if (isNearBottomRef.current) {
        // Other user sent message and current user was already at the bottom: keep view scrolled to recent
        forceScrollToBottom('smooth');
      } else {
        // Current user is scrolled up reading earlier messages: maintain position & show scroll-down button
        setShowScrollBottom(true);
      }
    }
  }, [
    sortedMessages,
    selectedUser?.id,
    mobileChatOpen,
    searchQuery,
    historyPageVersion,
    isLoadingOlderHistory,
    forceScrollToBottom,
  ]);

  // 3. Keep messages pinned to bottom on window resize (e.g. mobile keyboard toggle or device orientation)
  useEffect(() => {
    const handleResize = () => {
      if (isNearBottomRef.current && messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 4. Scroll event listener on messages container:
  // Detects when user scrolls up away from recent messages to toggle the scroll-down button
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    const isNear = distanceFromBottom < 120;
    isNearBottomRef.current = isNear;

    if (
      scrollTop < 100 &&
      hasMoreHistory &&
      !isLoadingOlderHistory &&
      !pendingHistoryScrollRef.current
    ) {
      pendingHistoryScrollRef.current = { scrollTop, scrollHeight };
      onLoadOlderHistory?.();
    }

    // Show floating button when scrolled up (> 140px away from bottom) and there is scrollable content
    if (scrollHeight > clientHeight + 80 && distanceFromBottom > 140) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
    }
  }, [hasMoreHistory, isLoadingOlderHistory, onLoadOlderHistory]);

  // 5. Automatic scroll-down button click handler
  const handleScrollToBottomClick = useCallback(() => {
    forceScrollToBottom('smooth');
    setShowScrollBottom(false);
  }, [forceScrollToBottom]);

  // Auto-resize textarea smoothly as user types or adds newlines (up to max 120px)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 24), 120);
      inputRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !stagedImage && !stagedFile && !editingMessage) return;
    stopTyping();

    if (editingMessage) {
      if (!inputText.trim()) return;
      const saved = await onEditMessage?.(editingMessage.id, inputText.trim());
      if (!saved) return;
      setEditingMessage(null);
      setInputText('');
      return;
    }

    let attachmentPayload = null;
    if (stagedImage) {
      attachmentPayload = {
        type: 'image',
        file: stagedImage.file,
        previewUrl: stagedImage.previewUrl,
        imageMeta: {
          fileName: stagedImage.name,
          fileSize: stagedImage.size,
          mimeType: stagedImage.file.type,
        },
      };
    } else if (stagedFile) {
      attachmentPayload = {
        type: 'file',
        file: stagedFile.file,
        fileMeta: {
          fileName: stagedFile.name,
          fileSize: stagedFile.size,
          mimeType: stagedFile.file.type || 'application/octet-stream',
          extension: stagedFile.name.includes('.')
            ? `.${stagedFile.name.split('.').pop().toLowerCase()}`
            : '',
        },
      };
    }

    onSendMessage(inputText.trim(), attachmentPayload, { replyTo: replyToMessage });

    setInputText('');
    setReplyToMessage(null);
    clearStagedImage();
    clearStagedFile();
    cursorPosRef.current = 0;
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const isMobile =
        window.innerWidth <= 768 ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0;

      if (isMobile) {
        return;
      }

      if (!e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  const handleToggleEmoji = () => {
    setShowEmojiPicker((prev) => {
      const next = !prev;
      if (next && inputRef.current) {
        inputRef.current.blur();
      }
      return next;
    });
  };

  const handleSelectEmoji = useCallback((emoji) => {
    setInputText((prev) => {
      const pos =
        cursorPosRef.current !== null && cursorPosRef.current <= prev.length
          ? cursorPosRef.current
          : prev.length;
      const nextText = prev.slice(0, pos) + emoji + prev.slice(pos);
      cursorPosRef.current = pos + emoji.length;
      return nextText;
    });
  }, []);

  const handleInputChange = (e) => {
    const nextText = e.target.value;
    setInputText(nextText);
    cursorPosRef.current = e.target.selectionStart;

    if (nextText.trim() && selectedUser?.id) {
      if (typingReceiverRef.current !== selectedUser.id) {
        stopTyping();
        typingReceiverRef.current = selectedUser.id;
        onTypingChange?.(selectedUser.id, true);
      }
      clearTimeout(typingStopTimeoutRef.current);
      typingStopTimeoutRef.current = setTimeout(stopTyping, 1500);
    } else {
      stopTyping();
    }
  };

  const handleInputSelect = (e) => {
    cursorPosRef.current = e.target.selectionStart;
  };

  const handleInputFocus = () => {
    setShowEmojiPicker(false);
  };

  return (
    <section
      className={`chat-main-area${isDragOver ? ' drag-active' : ''}`}
      aria-label="Conversation"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="chat-drag-overlay anim-fade-in">
          <div className="chat-drag-box">
            <UploadCloud size={48} className="drag-cloud-icon" />
            <h3 className="drag-title">Drop image to share</h3>
            <p className="drag-subtitle">Supports PNG, JPG, GIF, WebP up to 10MB</p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="chat-header">
        <div className="chat-header-user">
          {onBack && (
            <button
              type="button"
              className="chat-back-btn"
              onClick={onBack}
              aria-label="Back to conversations list"
              title="Back to users"
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
            </button>
          )}
          <Avatar user={selectedUser} size={42} showStatus={true} />
          <div className="chat-header-info">
            <h2 className="chat-header-name">
              {selectedUser?.username || 'Chat'}
              {isMuted && (
                <span className="chat-muted-indicator" title="Notifications muted">
                  <BellOff size={13} />
                </span>
              )}
            </h2>
            <div className="chat-header-status">
              <span
                className={`status-bullet ${selectedUser?.status === 'online' ? 'online' : 'offline'}`}
              />
              <span>
                {isPeerTyping ? (
                  <span className="chat-typing-status" role="status" aria-label="Typing">
                    typing
                    <span className="chat-typing-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  </span>
                ) : selectedUser?.status === 'online' ? (
                  'Online'
                ) : selectedUser?.lastSeen ? (
                  `Last seen ${selectedUser.lastSeen}`
                ) : (
                  'Offline'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="chat-header-actions" ref={menuRef}>
          <button
            type="button"
            className={`chat-action-btn${showSearch ? ' active' : ''}`}
            aria-label="Search conversation"
            title="Search conversation"
            onClick={() => {
              setShowSearch((prev) => !prev);
              setShowMoreMenu(false);
            }}
          >
            <Search size={18} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            className={`chat-action-btn${showMoreMenu ? ' active' : ''}`}
            aria-label="More conversation options"
            title="Conversation options"
            onClick={() => setShowMoreMenu((prev) => !prev)}
          >
            <MoreVertical size={18} strokeWidth={1.8} />
          </button>

          {/* More options dropdown menu */}
          {showMoreMenu && (
            <div className="chat-header-dropdown anim-scale-in" role="menu">
              <button
                type="button"
                className="chat-dropdown-item"
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowSearch(true);
                }}
              >
                <Search size={15} />
                <span>Search in chat</span>
              </button>

              <button
                type="button"
                className="chat-dropdown-item"
                disabled={isWallpaperUpdating}
                onClick={() => {
                  setShowMoreMenu(false);
                  wallpaperInputRef.current?.click();
                }}
              >
                <ImageIcon size={15} />
                <span>
                  {isWallpaperUpdating
                    ? 'Saving shared wallpaper...'
                    : wallpaper?.url
                      ? 'Change shared wallpaper'
                      : 'Set shared wallpaper'}
                </span>
              </button>

              {wallpaper?.url && (
                <button
                  type="button"
                  className="chat-dropdown-item"
                  disabled={isWallpaperUpdating}
                  onClick={handleRemoveWallpaper}
                >
                  <X size={15} />
                  <span>Remove shared wallpaper</span>
                </button>
              )}

              <button
                type="button"
                className="chat-dropdown-item"
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowProfileModal(true);
                }}
              >
                <User size={15} />
                <span>Contact info</span>
              </button>

              <button
                type="button"
                className="chat-dropdown-item"
                onClick={() => {
                  setShowMoreMenu(false);
                  handleExportChat();
                }}
              >
                <Download size={15} />
                <span>Export chat</span>
              </button>

              <button
                type="button"
                className="chat-dropdown-item"
                onClick={() => {
                  setShowMoreMenu(false);
                  setIsMuted((prev) => !prev);
                }}
              >
                {isMuted ? <Bell size={15} /> : <BellOff size={15} />}
                <span>{isMuted ? 'Unmute alerts' : 'Mute alerts'}</span>
              </button>

              {onClearConversation && (
                <button
                  type="button"
                  className="chat-dropdown-item danger"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleClearChat();
                  }}
                >
                  <Trash2 size={15} />
                  <span>Delete chat</span>
                </button>
              )}
            </div>
          )}
          <input
            ref={wallpaperInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleWallpaperSelected}
          />
        </div>
      </div>

      {/* Inline Search in conversation */}
      {showSearch && (
        <div className="chat-search-bar-inline anim-fade-down">
          <Search size={15} className="search-inline-icon" />
          <input
            type="search"
            autoFocus
            placeholder="Search in this conversation..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveMatchIndex(0);
            }}
            className="search-inline-input"
          />
          {searchQuery.trim() && (
            <span className="search-inline-count">
              {matchedMessageIds.length > 0
                ? `${activeMatchIndex + 1} of ${matchedMessageIds.length}`
                : 'No matches'}
            </span>
          )}
          {matchedMessageIds.length > 0 && (
            <div className="search-inline-nav">
              <button
                type="button"
                className="search-nav-arrow"
                onClick={handlePrevMatch}
                title="Previous match"
              >
                <ChevronUp size={15} />
              </button>
              <button
                type="button"
                className="search-nav-arrow"
                onClick={handleNextMatch}
                title="Next match"
              >
                <ChevronDown size={15} />
              </button>
            </div>
          )}
          <button
            type="button"
            className="search-inline-close"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            title="Close search"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Message History Wrapper & Scroll Container */}
      <div className="chat-messages-wrapper">
        <div
          className="chat-messages-container"
          ref={messagesContainerRef}
          onScroll={handleScroll}
          onClick={(event) => {
            if (event.target.closest('.message-context-menu')) return;
            if (didLongPressRef.current) {
              didLongPressRef.current = false;
              return;
            }
            setActiveMessageActionsId(null);
          }}
          style={
            wallpaper
              ? {
                  backgroundImage: `linear-gradient(rgba(7, 11, 8, 0.72), rgba(7, 11, 8, 0.72)), url("${getMediaUrl(wallpaper.url)}")`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                }
              : undefined
          }
        >
        {(hasMoreHistory || isLoadingOlderHistory) && (
          <div className="chat-history-loader" role="status">
            {isLoadingOlderHistory ? 'Loading older messages...' : 'Scroll up to load older messages'}
          </div>
        )}
        {sortedMessages.length === 0 ? (
          <div className="chat-empty-convo anim-fade-in">
            <span className="empty-convo-pill">
              No messages yet. Send a message to start chatting!
            </span>
          </div>
        ) : (
          <div className="chat-messages-list">
            {messageDateGroups.map((group) => (
              <div key={group.dateKey} className="chat-date-group">
                <div
                  className="chat-date-divider anim-fade-in"
                  role="separator"
                  aria-label={group.label}
                >
                  <span className="chat-date-pill">{group.label}</span>
                </div>

                <div className="chat-date-group-messages">
                  {group.messages.map((msg) => {
                    const isMe = msg.sender === 'me';
                    const isMatched = matchedMessageIds.includes(msg.id);
                    const isActiveMatch = matchedMessageIds[activeMatchIndex] === msg.id;
                    const hasImage = Boolean(msg.imageUrl);
                    const hasFile = Boolean(msg.fileUrl) || msg.messageType === 'file';
                    const resolvedImageUrl = hasImage ? getMediaUrl(msg.imageUrl) : null;
                    const resolvedFileUrl = hasFile ? getMediaUrl(msg.fileUrl) : null;
                    const fileInfo = hasFile
                      ? getFileInfo(msg.fileMeta?.fileName || msg.text)
                      : null;
                    const FileBadgeIcon = fileInfo ? fileInfo.Icon : File;
                    const groupedReactions = (msg.reactions || []).reduce((groups, reaction) => {
                      const group = groups.find((item) => item.emoji === reaction.emoji);
                      if (group) {
                        group.count += 1;
                        group.mine ||= reaction.userId === currentUserId;
                      } else {
                        groups.push({
                          emoji: reaction.emoji,
                          count: 1,
                          mine: reaction.userId === currentUserId,
                        });
                      }
                      return groups;
                    }, []);

                    return (
                      <div
                        key={msg.id}
                        id={`msg-${msg.id}`}
                        className={`chat-bubble-row ${isMe ? 'row-sent' : 'row-received'}${
                          isActiveMatch ? ' active-match-row' : ''
                        }`}
                      >
                    {/* Hover delete action button */}
                    {onDeleteMessage && (
                      <div className="bubble-actions-wrap">
                        <button
                          type="button"
                          className="bubble-action-btn delete"
                          onClick={() => setConfirmDeleteMsgId(msg.id)}
                          title="Delete message"
                          aria-label="Delete message"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}

                    <div
                      className={`chat-bubble ${isMe ? 'bubble-sent' : 'bubble-received'}${
                        isActiveMatch ? ' active-match' : isMatched ? ' search-match' : ''
                      }${hasImage ? ' has-image' : ''}${hasFile ? ' has-file' : ''}`}
                      onContextMenu={(event) => {
                        if (msg.id.startsWith('temp_') || event.target.closest('a')) return;
                        event.preventDefault();
                        setActiveMessageActionsId(msg.id);
                      }}
                      onTouchStart={(event) => handleMessageTouchStart(event, msg)}
                      onTouchMove={handleMessageTouchMove}
                      onTouchEnd={handleMessageTouchEnd}
                    >
                      {msg.replyTo?.messageId && (
                        <button
                          type="button"
                          className="message-reply-quote"
                          onClick={() => {
                            document
                              .getElementById(`msg-${msg.replyTo.messageId}`)
                              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                        >
                          <span>
                            {msg.replyTo.senderId === currentUserId
                              ? 'You'
                              : selectedUser?.username || 'Peer'}
                          </span>
                          <small>{msg.replyTo.content}</small>
                        </button>
                      )}

                      {/* Photo / Image bubble */}
                      {hasImage && (
                        <div
                          className="bubble-image-wrap"
                          onClick={(event) => {
                            if (didLongPressRef.current) {
                              didLongPressRef.current = false;
                              event.preventDefault();
                              event.stopPropagation();
                              return;
                            }
                            setActiveLightboxImage({
                              url: resolvedImageUrl,
                              fileName: msg.imageMeta?.fileName || 'image.png',
                              time: msg.time,
                              sender: isMe ? 'You' : selectedUser?.username || 'Peer',
                              caption: msg.text,
                            });
                          }}
                          title="Click to view full image"
                        >
                          <img
                            src={resolvedImageUrl}
                            alt={msg.text || msg.imageMeta?.fileName || 'Shared photo'}
                            className="bubble-image"
                            loading="lazy"
                            onLoad={() => {
                              if (isNearBottomRef.current) {
                                scrollToBottom('auto');
                              }
                            }}
                          />
                          <div className="bubble-image-overlay">
                            <Maximize2 size={16} className="bubble-zoom-icon" />
                            <span>View</span>
                          </div>
                        </div>
                      )}

                      {/* Generic File sharing bubble (WhatsApp Style) */}
                      {hasFile && (
                        <div className="bubble-file-card-wrap">
                          <div
                            className="bubble-file-card"
                            onClick={(e) => {
                              // If tapped or clicked on download button, do not open file
                              if (e.target.closest('.file-card-download-btn')) {
                                return;
                              }
                              if (didLongPressRef.current) {
                                didLongPressRef.current = false;
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                              }
                              handleOpenFile(resolvedFileUrl);
                            }}
                            title={`Open ${msg.fileMeta?.fileName || 'file'}`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenFile(resolvedFileUrl);
                              }
                            }}
                          >
                            <div
                              className="file-card-icon-badge"
                              style={{
                                borderLeft: `3px solid ${fileInfo.color}`,
                              }}
                            >
                              <FileBadgeIcon
                                size={22}
                                className="file-card-icon"
                                style={{ color: fileInfo.color }}
                              />
                              <span className="file-card-ext-tag">
                                {fileInfo.ext}
                              </span>
                            </div>
                            <div className="file-card-info">
                              <span
                                className="file-card-name"
                                title={msg.fileMeta?.fileName || 'Attachment'}
                              >
                                {msg.fileMeta?.fileName || 'Attachment'}
                              </span>
                              <div className="file-card-meta-row">
                                <span className="file-card-size">
                                  {formatFileSize(msg.fileMeta?.fileSize)}
                                </span>
                                <span className="file-card-bullet">•</span>
                                <span className="file-card-type">
                                  {fileInfo.label}
                                </span>
                              </div>
                            </div>
                            <a
                              href={`${resolvedFileUrl}${resolvedFileUrl.includes('?') ? '&' : '?'}download=1&name=${encodeURIComponent(msg.fileMeta?.fileName || 'file')}`}
                              download={msg.fileMeta?.fileName || 'file'}
                              className="file-card-download-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              onTouchStart={(e) => {
                                e.stopPropagation();
                              }}
                              onTouchEnd={(e) => {
                                e.stopPropagation();
                              }}
                              title={`Download ${msg.fileMeta?.fileName || 'file'}`}
                              aria-label={`Download ${msg.fileMeta?.fileName || 'file'}`}
                            >
                              <Download size={15} strokeWidth={2.2} />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Optional message / caption text */}
                      {Boolean(msg.text) && (
                        <span
                          className={`bubble-text${
                            hasImage || hasFile ? ' bubble-caption' : ''
                          }`}
                        >
                          {renderLinkedText(msg.text)}
                        </span>
                      )}

                      <div className="bubble-meta">
                        {msg.editedAt && <span className="bubble-edited-label">edited</span>}
                        <span className="bubble-time">{msg.time}</span>
                        {isMe && (
                          msg.deliveryStatus === 'sent' ? (
                            <Check
                              size={14}
                              className="bubble-check status-sent"
                              strokeWidth={2.2}
                              title="Sent"
                              aria-label="Sent"
                            />
                          ) : (
                            <CheckCheck
                              size={14}
                              className={`bubble-check status-${msg.deliveryStatus || 'sent'}`}
                              strokeWidth={2.2}
                              title={
                                msg.deliveryStatus === 'read'
                                  ? 'Read'
                                  : msg.deliveryStatus === 'delivered'
                                    ? 'Delivered'
                                    : 'Sent'
                              }
                              aria-label={
                                msg.deliveryStatus === 'read'
                                  ? 'Read'
                                  : msg.deliveryStatus === 'delivered'
                                    ? 'Delivered'
                                    : 'Sent'
                              }
                            />
                          )
                        )}
                      </div>

                      {groupedReactions.length > 0 && (
                        <div className="message-reactions" aria-label="Message reactions">
                          {groupedReactions.map((reaction) => (
                            <button
                              type="button"
                              key={reaction.emoji}
                              className={`message-reaction${reaction.mine ? ' mine' : ''}`}
                              onClick={() => onToggleReaction?.(msg.id, reaction.emoji)}
                              aria-label={`${reaction.emoji} reaction, ${reaction.count}`}
                            >
                              <span>{reaction.emoji}</span>
                              <small>{reaction.count}</small>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {activeMessageActionsId === msg.id && (
                      <div
                        className={`message-context-menu ${isMe ? 'sent-context-menu' : ''}`}
                        role="menu"
                        onClick={(event) => {
                          event.stopPropagation();
                          didLongPressRef.current = false;
                        }}
                      >
                        <div className="message-reaction-options">
                          {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                            <button
                              type="button"
                              key={emoji}
                              onClick={() => {
                                onToggleReaction?.(msg.id, emoji);
                                setActiveMessageActionsId(null);
                              }}
                              aria-label={`React ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <div className="message-action-options">
                          <button
                            type="button"
                            onClick={() => handleReplyToMessage(msg)}
                            title="Reply"
                          >
                            <Reply size={15} />
                            Reply
                          </button>
                          {isMe && onEditMessage && (
                            <button
                              type="button"
                              onClick={() => handleEditThisMessage(msg)}
                              title="Edit message"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                          )}
                          {onDeleteMessage && (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDeleteMsgId(msg.id);
                                setActiveMessageActionsId(null);
                              }}
                              title="Delete message"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Floating Scroll to Bottom Down-Arrow Button (Appears when scrolled up) */}
    {showScrollBottom && (
      <button
        type="button"
        className="chat-scroll-bottom-btn"
        onClick={handleScrollToBottomClick}
        aria-label="Scroll down to recent messages"
        title="Go to recent messages"
      >
        <ArrowDown size={19} strokeWidth={2.4} />
      </button>
    )}
  </div>

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelectEmoji={handleSelectEmoji}
          onClose={() => setShowEmojiPicker(false)}
          triggerRef={emojiButtonRef}
        />
      )}

      {/* Message Composer */}
      <div className="chat-composer-wrap" role="region" aria-label="Message composer">
        {(replyToMessage || editingMessage) && (
          <div className="composer-message-context">
            <div>
              <strong>{editingMessage ? 'Editing message' : `Replying to ${replyToMessage.senderId === currentUserId ? 'yourself' : selectedUser?.username || 'Peer'}`}</strong>
              {!editingMessage && <span>{replyToMessage.content}</span>}
            </div>
            <button
              type="button"
              onClick={() => {
                setReplyToMessage(null);
                setEditingMessage(null);
                setInputText('');
              }}
              aria-label="Cancel reply or edit"
              title="Cancel"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Staged Image Preview Bar (Appears above the input bar) */}
        {stagedImage && (
          <div className="chat-staged-image-bar anim-fade-up">
            <div className="staged-image-preview-wrap">
              <div className="staged-image-thumb-box">
                <img
                  src={stagedImage.previewUrl}
                  alt={stagedImage.name}
                  className="staged-image-thumb"
                />
              </div>
              <div className="staged-image-info">
                <span className="staged-image-name" title={stagedImage.name}>
                  {stagedImage.name}
                </span>
                <div className="staged-image-meta-row">
                  <span className="staged-image-size-pill">{stagedImage.sizeStr}</span>
                  <span className="staged-image-hint">Ready to send photo</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="staged-image-remove-btn"
              onClick={clearStagedImage}
              title="Remove attached image"
              aria-label="Remove attached image"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Staged Generic File Preview Bar (WhatsApp Style - Any extension) */}
        {stagedFile && (
          <div className="chat-staged-file-bar anim-fade-up">
            <div className="staged-file-preview-wrap">
              <div className="staged-file-icon-box">
                {(() => {
                  const SIcon = stagedFile.info.Icon;
                  return <SIcon size={22} style={{ color: stagedFile.info.color }} />;
                })()}
              </div>
              <div className="staged-file-info">
                <span className="staged-file-name" title={stagedFile.name}>
                  {stagedFile.name}
                </span>
                <div className="staged-file-meta-row">
                  <span className="staged-file-size-pill">{stagedFile.sizeStr}</span>
                  <span className="staged-file-hint">
                    Ready to send • {stagedFile.info.label}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="staged-image-remove-btn"
              onClick={clearStagedFile}
              title="Remove attached file"
              aria-label="Remove attached file"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Input Composer Row */}
        <div className="chat-composer-row">
          <div className="chat-composer-bar">
            {/* Share photo/image button */}
            <button
              type="button"
              className="composer-icon-btn"
              aria-label="Share photo"
              title="Share photo / image"
              onClick={() => imageInputRef.current?.click()}
            >
              <ImageIcon size={18} strokeWidth={1.8} />
            </button>
            <input
              type="file"
              ref={imageInputRef}
              accept="image/png, image/jpeg, image/gif, image/webp, image/svg+xml, image/bmp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) stageImageFile(file);
                e.target.value = '';
              }}
            />

            {/* Attachment button (Paperclip - ANY file extension like WhatsApp) */}
            <button
              type="button"
              className="composer-icon-btn"
              aria-label="Attach file"
              title="Attach any document or file"
              onClick={handleAttachClick}
            >
              <Paperclip size={18} strokeWidth={1.8} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            {/* Multiline Message Textarea with enterKeyHint="enter" for next line return */}
            <textarea
              ref={inputRef}
              rows={1}
              name="chat-msg-content"
              id="chat-composer-input"
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck="true"
              enterKeyHint="enter"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              className="composer-input"
              placeholder={
                stagedImage
                  ? 'Add a photo caption... (optional)'
                  : stagedFile
                    ? 'Add a file caption... (optional)'
                    : 'Type a message...'
              }
              value={inputText}
              onChange={handleInputChange}
              onSelect={handleInputSelect}
              onClick={handleInputSelect}
              onKeyUp={handleInputSelect}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              aria-label="Type a message"
            />

            {/* Emoji button */}
            <button
              ref={emojiButtonRef}
              type="button"
              className={`composer-icon-btn${showEmojiPicker ? ' active' : ''}`}
              aria-label="Add emoji"
              aria-expanded={showEmojiPicker}
              onClick={handleToggleEmoji}
            >
              <Smile size={18} strokeWidth={1.8} />
            </button>
          </div>

          {/* Circular glowing Send button */}
          <button
            type="button"
            className="composer-send-btn"
            aria-label="Send message"
            disabled={!inputText.trim() && !stagedImage && !stagedFile}
            onClick={handleSubmit}
          >
            <Send size={18} strokeWidth={2.2} className="send-icon" />
          </button>
        </div>
      </div>

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      {activeLightboxImage && (
        <div
          className="image-lightbox-overlay anim-fade-in"
          onClick={() => setActiveLightboxImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Full-size Image Preview"
        >
          <div
            className="image-lightbox-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="image-lightbox-header">
              <div className="lightbox-file-info">
                <span className="lightbox-filename">
                  {activeLightboxImage.fileName}
                </span>
                <span className="lightbox-meta">
                  Sent by {activeLightboxImage.sender} • {activeLightboxImage.time}
                </span>
              </div>
              <div className="lightbox-actions">
                <a
                  href={`${activeLightboxImage.url}${activeLightboxImage.url.includes('?') ? '&' : '?'}download=1&name=${encodeURIComponent(activeLightboxImage.fileName || 'image.png')}`}
                  download={activeLightboxImage.fileName || 'image.png'}
                  className="lightbox-action-btn"
                  title="Download image"
                >
                  <Download size={15} />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  className="lightbox-close-btn"
                  onClick={() => setActiveLightboxImage(null)}
                  title="Close viewer (Esc)"
                  aria-label="Close viewer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="image-lightbox-body">
              <img
                src={activeLightboxImage.url}
                alt={activeLightboxImage.caption || activeLightboxImage.fileName}
                className="image-lightbox-main-img"
              />
            </div>
            {activeLightboxImage.caption && (
              <div className="image-lightbox-footer">
                <p className="lightbox-caption">{activeLightboxImage.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Profile Modal */}
      {showProfileModal && (
        <UserInfoModal
          user={selectedUser}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Delete Single Message Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmDeleteMsgId)}
        title="Delete message?"
        message="Are you sure you want to delete this message? It will be removed permanently."
        confirmLabel="Delete Message"
        variant="danger"
        icon={Trash2}
        onConfirm={() => {
          if (confirmDeleteMsgId && onDeleteMessage) {
            onDeleteMessage(confirmDeleteMsgId);
          }
          setConfirmDeleteMsgId(null);
        }}
        onClose={() => setConfirmDeleteMsgId(null)}
      />

      {/* Delete Entire Chat Confirmation UI Popup */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Delete entire chat history?"
        message={
          <>
            Are you sure you want to delete all messages, photos, and shared files with{' '}
            <strong style={{ color: '#ffffff' }}>{selectedUser?.username}</strong>?
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete Chat"
        variant="danger"
        icon={Trash2}
        onConfirm={handleConfirmClear}
        onClose={() => setShowClearConfirm(false)}
      />
    </section>
  );
}
