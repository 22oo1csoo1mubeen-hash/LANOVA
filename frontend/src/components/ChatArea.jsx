import { useState, useRef, useEffect } from 'react';
import { Search, MoreVertical, Paperclip, Smile, Send, CheckCheck } from 'lucide-react';
import Avatar from './Avatar';

/**
 * ChatArea — central conversation panel.
 * Contains the conversation header, scrollable message bubbles,
 * and the message composer input with send button.
 */
export default function ChatArea({
  selectedUser,
  messages,
  onSendMessage,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom whenever messages change or user changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <section className="chat-main-area" aria-label="Conversation">
      {/* Top Header */}
      <div className="chat-header">
        <div className="chat-header-user">
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
      <div className="chat-messages-container">
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Composer */}
      <form className="chat-composer-wrap" onSubmit={handleSubmit}>
        <div className="chat-composer-bar">
          {/* Attachment button */}
          <button
            type="button"
            className="composer-icon-btn"
            aria-label="Attach file"
          >
            <Paperclip size={18} strokeWidth={1.8} />
          </button>

          {/* Text Input */}
          <input
            type="text"
            className="composer-input"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Type a message"
          />

          {/* Emoji button */}
          <button
            type="button"
            className="composer-icon-btn"
            aria-label="Add emoji"
            onClick={() => setInputText((prev) => prev + ' 👍')}
          >
            <Smile size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* Circular glowing Send button */}
        <button
          type="submit"
          className="composer-send-btn"
          aria-label="Send message"
          disabled={!inputText.trim()}
        >
          <Send size={18} strokeWidth={2.2} className="send-icon" />
        </button>
      </form>
    </section>
  );
}
