import { useState } from 'react';
import { Search, MoreVertical } from 'lucide-react';
import Avatar from './Avatar';

/**
 * ChatUserList — left panel of ChatPage.
 * Displays search bar, Users/Chats tabs, and the list of network users.
 */
export default function ChatUserList({
  users,
  selectedUser,
  onSelectUser,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(true);

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

            return (
              <div
                key={user.id}
                role="listitem"
                tabIndex={0}
                onClick={() => onSelectUser(user)}
                onKeyDown={(e) => e.key === 'Enter' && onSelectUser(user)}
                className={`chat-user-item${isSelected ? ' selected' : ''}`}
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

                {/* More options 3 dots button */}
                <button
                  type="button"
                  className="chat-user-more-btn"
                  aria-label={`Options for ${user.username}`}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
