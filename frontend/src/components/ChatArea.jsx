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
  User,
  Download,
  Trash2,
  Bell,
  BellOff,
  UploadCloud,
  Maximize2,
} from 'lucide-react';
import Avatar from './Avatar';
import EmojiPicker from './EmojiPicker';
import UserInfoModal from './UserInfoModal';
import ConfirmModal from './ConfirmModal';
import { getMediaUrl } from '../utils/api';

/**
 * ChatArea — central conversation panel.
 * Contains the conversation header with search & more options,
 * scrollable message bubbles with search highlight,
 * interactive emoji picker, image attachments, lightbox viewer,
 * and the message composer with drag & drop + paste support.
 */
export default function ChatArea({
  selectedUser,
  messages,
  onSendMessage,
  onBack,
  onClearConversation,
}) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Staged image for upload & preview
  const [stagedImage, setStagedImage] = useState(null);
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
  const [isMuted, setIsMuted] = useState(false);

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const menuRef = useRef(null);
  const cursorPosRef = useRef(null);

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

  // Compute matched message IDs for in-conversation search
  const matchedMessageIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return messages
      .filter((m) => m.text?.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [messages, searchQuery]);

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
  const handleExportChat = () => {
    if (!messages.length) {
      alert('No messages to export in this conversation.');
      return;
    }
    const transcript = messages
      .map(
        (m) =>
          `[${m.time || ''}] ${m.sender === 'me' ? 'You' : selectedUser?.username || 'Peer'}: ${m.text}`
      )
      .join('\n');
    const header = `========================================\nLANOVA Chat Transcript with ${selectedUser?.username || 'Peer'}\nExported: ${new Date().toLocaleString()}\nTotal Messages: ${messages.length}\n========================================\n\n`;
    const blob = new Blob([header + transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lanova-chat-${selectedUser?.username || 'conversation'}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const stageImageFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Only image files (PNG, JPG, GIF, WebP, SVG, BMP) can be shared as photos.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size exceeds the 10MB limit.');
      return;
    }
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

  // Handle attachment file selection (routes images to stageImageFile)
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
      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      const label = `📎 [${file.name} - ${sizeStr}]`;
      setInputText((prev) => (prev ? `${prev} ${label}` : label));
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
    if (file && file.type.startsWith('image/')) {
      stageImageFile(file);
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

  // Auto-scroll messages container smoothly to bottom on new messages
  useEffect(() => {
    if (messagesContainerRef.current && !searchQuery.trim()) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, selectedUser, searchQuery]);

  // Auto-resize textarea smoothly as user types or adds newlines (up to max 120px)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 24), 120);
      inputRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !stagedImage) return;

    onSendMessage(
      inputText.trim(),
      stagedImage
        ? {
            file: stagedImage.file,
            previewUrl: stagedImage.previewUrl,
            imageMeta: {
              fileName: stagedImage.name,
              fileSize: stagedImage.size,
              mimeType: stagedImage.file.type,
            },
          }
        : null
    );

    setInputText('');
    clearStagedImage();
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
    setInputText(e.target.value);
    cursorPosRef.current = e.target.selectionStart;
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
                {selectedUser?.status === 'online'
                  ? 'Online'
                  : selectedUser?.lastSeen
                    ? `Last seen ${selectedUser.lastSeen}`
                    : 'Offline'}
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
                  <span>Clear messages</span>
                </button>
              )}
            </div>
          )}
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

      {/* Message History */}
      <div className="chat-messages-container" ref={messagesContainerRef}>
        {/* Date badge */}
        <div className="chat-date-divider">
          <span className="chat-date-pill">Today</span>
        </div>

        {/* Message bubbles */}
        <div className="chat-messages-list">
          {messages.map((msg) => {
            const isMe = msg.sender === 'me';
            const isMatched = matchedMessageIds.includes(msg.id);
            const isActiveMatch = matchedMessageIds[activeMatchIndex] === msg.id;
            const hasImage = Boolean(msg.imageUrl);
            const resolvedImageUrl = hasImage ? getMediaUrl(msg.imageUrl) : null;

            return (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={`chat-bubble-row ${isMe ? 'row-sent' : 'row-received'}${
                  isActiveMatch ? ' active-match-row' : ''
                }`}
              >
                <div
                  className={`chat-bubble ${isMe ? 'bubble-sent' : 'bubble-received'}${
                    isActiveMatch ? ' active-match' : isMatched ? ' search-match' : ''
                  }${hasImage ? ' has-image' : ''}`}
                >
                  {hasImage && (
                    <div
                      className="bubble-image-wrap"
                      onClick={() =>
                        setActiveLightboxImage({
                          url: resolvedImageUrl,
                          fileName: msg.imageMeta?.fileName || 'image.png',
                          time: msg.time,
                          sender: isMe ? 'You' : selectedUser?.username || 'Peer',
                          caption: msg.text,
                        })
                      }
                      title="Click to view full image"
                    >
                      <img
                        src={resolvedImageUrl}
                        alt={msg.text || msg.imageMeta?.fileName || 'Shared photo'}
                        className="bubble-image"
                        loading="lazy"
                      />
                      <div className="bubble-image-overlay">
                        <Maximize2 size={16} className="bubble-zoom-icon" />
                        <span>View</span>
                      </div>
                    </div>
                  )}

                  {Boolean(msg.text) && (
                    <span className={`bubble-text${hasImage ? ' bubble-caption' : ''}`}>
                      {msg.text}
                    </span>
                  )}

                  <div className="bubble-meta">
                    <span className="bubble-time">{msg.time}</span>
                    {isMe && (
                      <CheckCheck size={14} className="bubble-check" strokeWidth={2.2} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
                  <span className="staged-image-hint">Ready to send</span>
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

            {/* Attachment button */}
            <button
              type="button"
              className="composer-icon-btn"
              aria-label="Attach file"
              title="Attach file"
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
              placeholder={stagedImage ? 'Add a caption... (optional)' : 'Type a message...'}
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
            disabled={!inputText.trim() && !stagedImage}
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
                  href={activeLightboxImage.url}
                  download={activeLightboxImage.fileName}
                  target="_blank"
                  rel="noreferrer"
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

      {/* Clear Chat Confirmation UI Popup */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear chat history?"
        message={
          <>
            Are you sure you want to clear all messages with{' '}
            <strong style={{ color: '#ffffff' }}>{selectedUser?.username}</strong>?
            This will permanently remove the conversation from this session.
          </>
        }
        confirmLabel="Clear Messages"
        variant="danger"
        icon={Trash2}
        onConfirm={handleConfirmClear}
        onClose={() => setShowClearConfirm(false)}
      />
    </section>
  );
}
