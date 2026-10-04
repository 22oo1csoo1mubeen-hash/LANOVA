import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  MoreVertical,
  Paperclip,
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
} from 'lucide-react';
import Avatar from './Avatar';
import EmojiPicker from './EmojiPicker';
import UserInfoModal from './UserInfoModal';
import ConfirmModal from './ConfirmModal';

/**
 * ChatArea — central conversation panel.
 * Contains the conversation header with search & more options,
 * scrollable message bubbles with search highlight,
 * interactive emoji picker, and the message composer with attachment & send.
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

  // Handle attachment file selection
  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = Math.round(file.size / 1024);
    const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    const label = `📎 [${file.name} - ${sizeStr}]`;
    setInputText((prev) => (prev ? `${prev} ${label}` : label));
    e.target.value = '';
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

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
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
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
    <section className="chat-main-area" aria-label="Conversation">
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
                  }`}
                >
                  <span className="bubble-text">{msg.text}</span>
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
        <div className="chat-composer-bar">
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
            placeholder="Type a message..."
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
          disabled={!inputText.trim()}
          onClick={handleSubmit}
        >
          <Send size={18} strokeWidth={2.2} className="send-icon" />
        </button>
      </div>

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
