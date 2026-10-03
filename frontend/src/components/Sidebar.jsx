import { NavLink } from 'react-router-dom';
import { MessageSquare, Radio, MoreVertical } from 'lucide-react';

/**
 * Sidebar — shared navigation sidebar for Chat and Network pages.
 * Provides clear navigation between Chats and Network Info.
 */
export default function Sidebar() {
  return (
    <aside className="lanova-nav-sidebar" aria-label="Application navigation">
      <nav className="lanova-nav-list">
        {/* Chats Link */}
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `lanova-nav-item${isActive ? ' active-nav' : ''}`
          }
        >
          <div className="lanova-nav-item-content">
            <MessageSquare size={18} strokeWidth={1.8} className="nav-icon" />
            <span>Chats</span>
          </div>
        </NavLink>

        {/* Network Info Link */}
        <NavLink
          to="/network"
          className={({ isActive }) =>
            `lanova-nav-item${isActive ? ' active-nav' : ''}`
          }
        >
          <div className="lanova-nav-item-content">
            <Radio size={18} strokeWidth={1.8} className="nav-icon" />
            <span>Network Info</span>
          </div>
          <span className="nav-item-more" aria-hidden="true">
            <MoreVertical size={16} />
          </span>
        </NavLink>
      </nav>
    </aside>
  );
}
