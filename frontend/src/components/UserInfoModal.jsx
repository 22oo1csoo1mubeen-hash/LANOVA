import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquare, Copy, Shield, Wifi, Radio } from 'lucide-react';
import Avatar from './Avatar';
import { copyToClipboard } from '../utils/clipboard';

/**
 * UserInfoModal — displays detailed network and profile information
 * for a selected LAN peer/user.
 */
export default function UserInfoModal({ user, onClose, onOpenChat }) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!user) return null;

  const handleCopy = async () => {
    const success = await copyToClipboard(user.username);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isOnline = user.status === 'online';

  return createPortal(
    <div
      className="lanova-modal-overlay anim-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-info-title"
    >
      <div className="lanova-modal-card anim-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header Close */}
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* User Identity Section */}
        <div className="modal-profile-hero">
          <div className="modal-avatar-wrap">
            <Avatar user={user} size={72} showStatus={false} />
            <span className={`modal-status-badge ${isOnline ? 'online' : 'offline'}`} />
          </div>

          <h3 id="user-info-title" className="modal-username">
            {user.username}
          </h3>
          <p className="modal-status-label">
            {isOnline
              ? 'Connected to LAN Mesh'
              : user.lastSeen
                ? `Last seen ${user.lastSeen}`
                : 'Offline'}
          </p>
        </div>

        {/* Network & Device Info List */}
        <div className="modal-info-list">
          <div className="modal-info-row">
            <div className="modal-info-left">
              <Shield size={16} className="modal-info-icon" />
              <span>Network Peer ID</span>
            </div>
            <span className="modal-info-value mono">{String(user.id || '').slice(0, 10)}...</span>
          </div>

          <div className="modal-info-row">
            <div className="modal-info-left">
              <Radio size={16} className="modal-info-icon" />
              <span>LAN Node</span>
            </div>
            <span className="modal-info-value mono">node-{String(user.id || 'peer').slice(-6)}.local</span>
          </div>

          <div className="modal-info-row">
            <div className="modal-info-left">
              <Wifi size={16} className="modal-info-icon" />
              <span>Connection</span>
            </div>
            <span className="modal-info-value">TCP / WebSocket</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button
            type="button"
            className="modal-action-btn secondary"
            onClick={handleCopy}
          >
            <Copy size={16} />
            <span>{copied ? 'Copied!' : 'Copy Username'}</span>
          </button>

          {onOpenChat && (
            <button
              type="button"
              className="modal-action-btn primary"
              onClick={() => {
                onOpenChat(user);
                onClose();
              }}
            >
              <MessageSquare size={16} />
              <span>Message</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
