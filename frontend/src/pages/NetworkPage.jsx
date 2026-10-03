import { useState } from 'react';
import { Monitor, Server, Wifi, Users, Share2, Activity, Check, Copy } from 'lucide-react';
import NetworkCard from '../components/NetworkCard';
import { mockNetworkInfo } from '../data/mockNetworkInfo';
import '../styles/network.css';

/**
 * NetworkPage — displays Computer Networking details, local IP,
 * port, WebSocket connection status, and active user metrics.
 */
export default function NetworkPage() {
  const [copiedLink, setCopiedLink] = useState(false);
  const shareUrl = `http://${mockNetworkInfo.lanIp}:${mockNetworkInfo.serverPort}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const connectionRows = [
    { label: 'Server Status', value: 'Online', isOnline: true },
    { label: 'Database Sync', value: 'Connected', isOnline: true },
    { label: 'WebSocket Daemon', value: 'Active (TCP)', isOnline: true },
    { label: 'Client Connection', value: 'Connected', isOnline: true },
    { label: 'Network Protocol', value: 'TCP / WebSocket', isOnline: false },
    { label: 'Transport Mode', value: 'LAN Broadcast', isOnline: false },
  ];

  return (
    <div className="network-layout-grid">
      {/* Network Dashboard Content */}
      <section className="network-dashboard-main" aria-label="Network Information">
        {/* Top Header Row */}
        <div className="network-page-header">
          <div className="network-header-left">
            <span className="network-eyebrow">NETWORK MONITOR</span>
            <h1 className="network-main-title">
              Network <span className="title-accent">Information</span>
            </h1>
            <p className="network-subtitle">
              Your local server details, protocols, and real-time connection telemetry.
            </p>
          </div>

          <div className="network-header-right">
            <div className="network-status-badge">
              <span className="status-bullet online glow" />
              <span>Connected to LANOVA</span>
            </div>
            <span className="network-status-sub">
              Real-time communication over LAN
            </span>
          </div>
        </div>

        {/* 2x2 Metric Cards Grid */}
        <div className="network-cards-grid">
          {/* 1. LAN IP Address */}
          <NetworkCard
            icon={Monitor}
            label="LAN IP Address"
            value={mockNetworkInfo.lanIp}
            subtext="Use this address on other devices in the same network."
            isCopyable={true}
            copyValue={mockNetworkInfo.lanIp}
          />

          {/* 2. Server Port */}
          <NetworkCard
            icon={Server}
            label="Server Port"
            value={mockNetworkInfo.serverPort}
            subtext="The server is listening for sockets on this port."
            isCopyable={true}
            copyValue={String(mockNetworkInfo.serverPort)}
          />

          {/* 3. Subnet */}
          <NetworkCard
            icon={Wifi}
            label="Subnet Mask"
            value={mockNetworkInfo.subnet || '255.255.255.0'}
            subtext="Local IPv4 subnet mask for broadcast domain."
          />

          {/* 4. Active Users */}
          <NetworkCard
            icon={Users}
            label="Active LAN Peers"
            value={`${mockNetworkInfo.activeUsers} Online`}
            subtext="Discovered users currently active on your LAN."
          />
        </div>

        {/* Bottom 2 Detail Glass Cards */}
        <div className="network-details-grid">
          {/* Card 5: Connect to Network */}
          <div className="net-detail-card connect-card">
            <div className="net-detail-header">
              <div className="net-detail-icon-circle">
                <Share2 size={18} strokeWidth={2} />
              </div>
              <div className="net-detail-title-wrap">
                <span className="net-detail-badge">Instant Peer Link</span>
                <h2 className="net-detail-title">Connect to Network</h2>
              </div>
            </div>
            <p className="net-detail-desc">
              Share your local server URL with peers on the same Wi-Fi or Ethernet switch to start chatting instantly without external internet.
            </p>
            <div className="net-share-url-box">
              <code className="net-share-code">{shareUrl}</code>
              <button
                type="button"
                className={`net-copy-btn${copiedLink ? ' copied' : ''}`}
                onClick={handleCopyLink}
                aria-label="Copy server URL"
              >
                {copiedLink ? (
                  <>
                    <Check size={14} strokeWidth={2.4} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} strokeWidth={2} /> Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 6: Live Connection Status */}
          <div className="net-detail-card connection-card">
            <div className="net-detail-header">
              <div className="net-detail-icon-circle pulse">
                <Activity size={18} strokeWidth={2} />
              </div>
              <div className="net-detail-title-wrap">
                <span className="net-detail-badge online-badge">Live Telemetry</span>
                <h2 className="net-detail-title">Connection Status</h2>
              </div>
            </div>
            <div className="net-detail-rows">
              {connectionRows.map((item) => (
                <div key={item.label} className="net-detail-row">
                  <span className="net-row-label">
                    {item.isOnline && <span className="status-bullet online glow-dot" />}
                    {item.label}
                  </span>
                  <span className={`net-row-val${item.isOnline ? ' val-online' : ''}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
