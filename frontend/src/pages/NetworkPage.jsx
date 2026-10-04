import { useState, useEffect, useCallback } from 'react';
import { Monitor, Server, Wifi, Users, Share2, Activity, Check, Copy, RefreshCw } from 'lucide-react';
import NetworkCard from '../components/NetworkCard';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import { copyToClipboard } from '../utils/clipboard';
import '../styles/network.css';

/**
 * NetworkPage — Displays real-time Computer Networks telemetry:
 * Local IPv4 address, listening port, subnet mask, active WebSocket peers,
 * client connection state, and instant LAN sharing link.
 */
export default function NetworkPage() {
  const { isConnected, onlineUserIds } = useSocket();
  const [copiedLink, setCopiedLink] = useState(false);
  const [netData, setNetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNetworkTelemetry = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.get('/api/network/info');
      setNetData(data);
    } catch (err) {
      console.warn('[NetworkPage] Telemetry fetch notice:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNetworkTelemetry();
  }, [fetchNetworkTelemetry]);

  // Derive active values from backend telemetry
  const lanIp =
    netData?.network?.lanIp ||
    (typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1');
  const serverPort = netData?.server?.port || 5000;
  const subnet = netData?.network?.subnet || '255.255.255.0';
  const clientIp = netData?.client?.ip || '127.0.0.1';
  const hostname = netData?.server?.hostname || 'LAN Host';
  const interfaceName = netData?.network?.interfaceName || 'Local Area Network';
  const dbConnected = netData?.database?.status === 'connected';

  // Active peers count (prefers live WebSocket presence)
  const activePeers =
    onlineUserIds.size > 0 ? onlineUserIds.size : netData?.network?.activeUsers || 1;

  // The URL other devices on the LAN use to load LANOVA in their browser
  const shareUrl = `http://${lanIp}:5173`;

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const connectionRows = [
    {
      label: 'Server Host',
      value: `${hostname} (Port ${serverPort})`,
      isOnline: true,
    },
    {
      label: 'Database Sync',
      value: dbConnected ? 'Connected (MongoDB)' : 'Connecting...',
      isOnline: dbConnected,
    },
    {
      label: 'WebSocket Daemon',
      value: isConnected ? `Active (TCP port ${serverPort})` : 'Connecting...',
      isOnline: isConnected,
    },
    {
      label: 'Observed Client IP',
      value: clientIp,
      isOnline: true,
    },
    {
      label: 'Network Protocol',
      value: 'TCP / WebSocket over HTTP',
      isOnline: false,
    },
    {
      label: 'Active Interface',
      value: `${interfaceName} (LAN IPv4)`,
      isOnline: false,
    },
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
              Host server details, transport protocols, and real-time LAN telemetry.
            </p>
          </div>

          <div className="network-header-right">
            <div className="network-status-badge">
              <span className={`status-bullet ${isConnected ? 'online glow' : 'offline'}`} />
              <span>{isConnected ? 'Connected to LANOVA' : 'Connecting to Server...'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="network-status-sub">
                Real-time communication over LAN
              </span>
              <button
                type="button"
                className="net-card-action-btn"
                style={{ width: '28px', height: '28px', padding: '0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => fetchNetworkTelemetry(true)}
                title="Refresh network telemetry"
                aria-label="Refresh network telemetry"
              >
                <RefreshCw size={13} className={refreshing ? 'anim-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* 2x2 Metric Cards Grid */}
        <div className="network-cards-grid">
          {/* 1. LAN IP Address */}
          <NetworkCard
            icon={Monitor}
            label="LAN IP Address"
            value={lanIp}
            subtext="Use this address on other devices in the same local network."
            isCopyable={true}
            copyValue={lanIp}
          />

          {/* 2. Server Port */}
          <NetworkCard
            icon={Server}
            label="Server Port"
            value={serverPort}
            subtext="Node.js HTTP & WebSocket server is listening on this port."
            isCopyable={true}
            copyValue={String(serverPort)}
          />

          {/* 3. Subnet */}
          <NetworkCard
            icon={Wifi}
            label="Subnet Mask"
            value={subnet}
            subtext="IPv4 subnet mask defining the local broadcast domain."
          />

          {/* 4. Active Users */}
          <NetworkCard
            icon={Users}
            label="Active LAN Peers"
            value={`${activePeers} Online`}
            subtext="Discovered peers currently authenticated on your LAN."
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
