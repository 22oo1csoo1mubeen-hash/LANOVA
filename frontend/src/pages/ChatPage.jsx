import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import ChatUserList from '../components/ChatUserList';
import ChatArea from '../components/ChatArea';
import { mockUsers } from '../data/mockUsers';
import { mockConversations } from '../data/mockMessages';
import '../styles/chat.css';

/**
 * ChatPage — primary messaging interface for LANOVA.
 * Features:
 * 1. Left navigation sidebar (Chats, Network Info).
 * 2. Users list with instant search.
 * 3. Expanded real-time chat view with message bubbles and composer.
 */
export default function ChatPage() {
  const [users] = useState(mockUsers);
  const [selectedUser, setSelectedUser] = useState(mockUsers[0]);
  const [conversations, setConversations] = useState(mockConversations);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleSendMessage = (text) => {
    if (!selectedUser) return;

    // Format current time (e.g. "10:28 AM")
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const timeStr = `${formattedHours}:${minutes} ${ampm}`;

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: 'me',
      text,
      time: timeStr,
      read: true,
    };

    setConversations((prev) => {
      const currentList = prev[selectedUser.id] || [];
      return {
        ...prev,
        [selectedUser.id]: [...currentList, newMsg],
      };
    });
  };

  const currentMessages = conversations[selectedUser?.id] || [];

  return (
    <AppLayout pageType="chat">
      <div className="chat-layout-grid">
        {/* Users list panel */}
        <ChatUserList
          users={users}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
        />

        {/* Main Chat conversation area */}
        <ChatArea
          selectedUser={selectedUser}
          messages={currentMessages}
          onSendMessage={handleSendMessage}
        />
      </div>
    </AppLayout>
  );
}
