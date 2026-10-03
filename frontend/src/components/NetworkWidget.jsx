import { useNavigate } from 'react-router-dom';
import { Radio, Monitor, Server, Wifi, Users } from 'lucide-react';
import { mockNetworkInfo } from '../data/mockNetworkInfo';

/**
 * NetworkWidget — right panel of ChatPage matching the reference.
 * Displays quick LAN stats and provides a link to the full Network Information page.
 */
export default function NetworkWidget() {
  const navigate = useNavigate();

  return (
    <aside className="chat-network-widget" aria-label="Quick network summary">
      {/* Clickable Header Button */}
      <div
        className="network-widget-header"
        onClick={() => navigate('/network')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/network')}
        title="View full Network Information"
      >
        <div className="network-widget-icon-wrap">
          <Radio size={18} strokeWidth={2} className="network-widget-radio-icon" />
        </div>
        <span className="network-widget-title">Network Information</span>
      </div>

      {/* Stats List */}
      <div className="network-widget-stats">
        {/* LAN IP Address */}
        <div className="network-stat-row">
          <div className="network-stat-icon-wrap">
            <Monitor size={18} strokeWidth={1.8} />
          </div>
          <div className="network-stat-content">
            <span className="network-stat-label">LAN IP Address</span>
            <span className="network-stat-val">{mockNetworkInfo.lanIp}</span>
          </div>
        </div>

        {/* Server Port */}
        <div className="network-stat-row">
          <div className="network-stat-icon-wrap">
            <Server size={18} strokeWidth={1.8} />
          </div>
          <div className="network-stat-content">
            <span className="network-stat-label">Server Port</span>
            <span className="network-stat-val">{mockNetworkInfo.serverPort}</span>
          </div>
        </div>

        {/* WebSocket Status */}
        <div className="network-stat-row">
          <div className="network-stat-icon-wrap">
            <Wifi size={18} strokeWidth={1.8} />
          </div>
          <div className="network-stat-content">
            <span className="network-stat-label">WebSocket Status</span>
            <span className="network-stat-val val-connected">
              <span className="status-bullet online" />
              {mockNetworkInfo.wsStatus}
            </span>
          </div>
        </div>

        {/* Active Users */}
        <div className="network-stat-row">
          <div className="network-stat-icon-wrap">
            <Users size={18} strokeWidth={1.8} />
          </div>
          <div className="network-stat-content">
            <span className="network-stat-label">Active Users</span>
            <span className="network-stat-val">{mockNetworkInfo.activeUsers} Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
