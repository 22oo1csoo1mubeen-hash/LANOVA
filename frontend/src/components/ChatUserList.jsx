import { useState, useEffect } from 'react';
import { Search, MoreVertical, MessageSquare, User, Copy, Trash2 } from 'lucide-react';
import Avatar from './Avatar';
import UserInfoModal from './UserInfoModal';
import ConfirmModal from './ConfirmModal';
import { copyToClipboard } from '../utils/clipboard';

/**
 * ChatUserList — left panel of ChatPage.
 * Displays search bar, Users/Chats tabs, and the list of network users.
 */
export default function ChatUserList({
  users,
  selectedUser,
  onSelectUser,
  onClearConversation,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [activeMenuUserId, setActiveMenuUserId] = useState(null);
  const [copiedUserId, setCopiedUserId] = useState(null);
  const [inspectUser, setInspectUser] = useState(null);
  const [confirmClearUser, setConfirmClearUser] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e?.target?.closest && e.target.closest('.chat-user-more-wrap')) {
        return;
      }
      setActiveMenuUserId(null);
    };
    if (activeMenuUserId) {
      const timer = setTimeout(() => {
        window.addEventListener('pointerdown', handleOutsideClick);
      }, 0);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('pointerdown', handleOutsideClick);
      };
    }
  }, [activeMenuUserId]);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="chat-users-panel" aria-label="Users list">
      {/* Search Input */}
      <div className="chat-search-wrap">
        <Search size={16} className="chat-search-icon" />
        <input
          type="search"
          name="user-search-query"
          id="user-search-query"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          readOnly={isReadOnly}
          onFocus={() => setIsReadOnly(false)}
          onTouchStart={() => setIsReadOnly(false)}
          onBlur={() => setIsReadOnly(true)}
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          aria-autocomplete="none"
          className="chat-search-input"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search users"
        />
      </div>

      {/* Users List */}
      <div className="chat-users-list" role="list">
        {filteredUsers.length === 0 ? (
          <div className="chat-no-users">No users found</div>
        ) : (
          filteredUsers.map((user) => {
            const isSelected = selectedUser?.id === user.id;
            const isMenuActive = activeMenuUserId === user.id;

            return (
              <div
                key={user.id}
                role="listitem"
                tabIndex={0}
                onClick={() => onSelectUser(user)}
                onKeyDown={(e) => e.key === 'Enter' && onSelectUser(user)}
                className={`chat-user-item${isSelected ? ' selected' : ''}${isMenuActive ? ' menu-active' : ''}`}
              >
                {/* Avatar with Status Dot */}
                <Avatar user={user} size={38} showStatus={true} />

                {/* User Details */}
                <div className="chat-user-info">
                  <span className="chat-user-name">{user.username}</span>
                  <div className="chat-user-status-text">
                    <span
                      className={`status-bullet ${user.status === 'online' ? 'online' : 'offline'}`}
                    />
                    <span>
                      {user.status === 'online'
                        ? 'Online'
                        : user.lastSeen
                          ? `Last seen ${user.lastSeen}`
                          : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* More options 3 dots button with contextual dropdown */}
                <div className="chat-user-more-wrap" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`chat-user-more-btn${isMenuActive ? ' active' : ''}`}
                    aria-label={`Options for ${user.username}`}
                    title="User options"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuUserId((prev) => (prev === user.id ? null : user.id));
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuActive && (
                    <div
                      className="chat-user-dropdown anim-scale-in"
                      role="menu"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="chat-user-dropdown-item"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuUserId(null);
                          onSelectUser(user);
                        }}
                      >
                        <MessageSquare size={14} />
                        <span>Open Chat</span>
                      </button>

                      <button
                        type="button"
                        className="chat-user-dropdown-item"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuUserId(null);
                          setInspectUser(user);
                        }}
                      >
                        <User size={14} />
                        <span>View Profile</span>
                      </button>

                      <button
                        type="button"
                        className="chat-user-dropdown-item"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={async (e) => {
                          e.stopPropagation();
                          const success = await copyToClipboard(user.username);
                          if (success) {
                            setCopiedUserId(user.id);
                            setTimeout(() => {
                              setCopiedUserId(null);
                              setActiveMenuUserId(null);
                            }, 1200);
                          }
                        }}
                      >
                        <Copy size={14} />
                        <span>{copiedUserId === user.id ? 'Copied!' : 'Copy Username'}</span>
                      </button>

                      {onClearConversation && (
                        <button
                          type="button"
                          className="chat-user-dropdown-item danger"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuUserId(null);
                            setConfirmClearUser(user);
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Clear History</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* User Details Modal */}
      {inspectUser && (
        <UserInfoModal
          user={inspectUser}
          onClose={() => setInspectUser(null)}
          onOpenChat={onSelectUser}
        />
      )}

      {/* Clear History Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmClearUser)}
        title="Clear chat history?"
        message={
          <>
            Are you sure you want to clear all messages with{' '}
            <strong style={{ color: '#ffffff' }}>{confirmClearUser?.username}</strong>?
            This will permanently remove the conversation from this session.
          </>
        }
        confirmLabel="Clear History"
        variant="danger"
        icon={Trash2}
        onConfirm={() => {
          if (confirmClearUser && onClearConversation) {
            onClearConversation(confirmClearUser.id);
          }
          setConfirmClearUser(null);
        }}
        onClose={() => setConfirmClearUser(null)}
      />
    </aside>
  );
}
