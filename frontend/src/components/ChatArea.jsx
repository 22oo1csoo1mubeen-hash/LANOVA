import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MoreVertical, Paperclip, Smile, Send, CheckCheck, ArrowLeft } from 'lucide-react';
import Avatar from './Avatar';
import EmojiPicker from './EmojiPicker';

/**
 * ChatArea — central conversation panel.
 * Contains the conversation header, scrollable message bubbles,
 * interactive emoji picker, and the message composer input with glowing send button.
 */
export default function ChatArea({
  selectedUser,
  messages,
  onSendMessage,
  onBack,
}) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const emojiButtonRef = useRef(null);

  // Auto-scroll messages container smoothly to bottom (contained within container, never scrolls window/page!)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, selectedUser]);

  const cursorPosRef = useRef(null);

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
        // On mobile, Enter points to next line (inserts newline), NEVER sends!
        return;
      }

      // On desktop with physical keyboard, Enter sends, Shift+Enter inserts newline
      if (!e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  const handleToggleEmoji = () => {
    setShowEmojiPicker((prev) => {
      const next = !prev;
      // When opening emoji picker, dismiss mobile keyboard so emojis have full screen space
      if (next && inputRef.current) {
        inputRef.current.blur();
      }
      return next;
    });
  };

  // Insert emoji at tracked cursor position WITHOUT calling input.focus(), preventing mobile keyboard from popping up
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
    // When user explicitly taps the text field to type words, close emoji picker so keyboard can show naturally
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
            <h2 className="chat-header-name">{selectedUser?.username || 'Chat'}</h2>
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
        <div className="chat-header-actions">
          <button className="chat-action-btn" aria-label="Search conversation">
            <Search size={18} strokeWidth={1.8} />
          </button>
          <button className="chat-action-btn" aria-label="More conversation options">
            <MoreVertical size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>

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

            return (
              <div
                key={msg.id}
                className={`chat-bubble-row ${isMe ? 'row-sent' : 'row-received'}`}
              >
                <div className={`chat-bubble ${isMe ? 'bubble-sent' : 'bubble-received'}`}>
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
          >
            <Paperclip size={18} strokeWidth={1.8} />
          </button>

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
    </section>
  );
}
