import { useNavigate } from 'react-router-dom';
import { Monitor, Server, Wifi, Users, Share2, Activity } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import NetworkCard from '../components/NetworkCard';
import { mockNetworkInfo, mockConnectionStatus } from '../data/mockNetworkInfo';
import '../styles/network.css';

/**
 * NetworkPage — displays Computer Networking details, local IP,
 * port, WebSocket connection status, and active user metrics.
 */
export default function NetworkPage() {
  const navigate = useNavigate();

  return (
    <AppLayout pageType="network">
      <div className="network-layout-grid">
        {/* Network Dashboard Content */}
        <section className="network-dashboard-main" aria-label="Network Information">
          {/* Top Header Row */}
          <div className="network-page-header">
            <div className="network-header-left">
              <span className="network-eyebrow">NETWORK</span>
              <h1 className="network-main-title">
                Network <span className="title-accent">Information</span>
              </h1>
              <p className="network-subtitle">
                Your local server details and real-time connection status.
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
              subtext="The server is running on this port."
              isCopyable={true}
              copyValue={String(mockNetworkInfo.serverPort)}
            />

            {/* 3. WebSocket Status */}
            <NetworkCard
              icon={Wifi}
              label="WebSocket Status"
              value={mockNetworkInfo.wsStatus}
              subtext="Real-time communication is active."
              isStatus={true}
            />

            {/* 4. Active Users */}
            <NetworkCard
              icon={Users}
              label="Active Users"
              value={`${mockNetworkInfo.activeUsers} Online`}
              subtext="Users currently connected to the server."
              isArrow={true}
              onArrowClick={() => navigate('/chat')}
            />
          </div>

          {/* Bottom 2 Detail Cards */}
          <div className="network-details-grid">
            {/* Connection Details Card */}
            <div className="net-detail-card">
              <div className="net-detail-header">
                <div className="net-detail-icon-circle">
                  <Share2 size={18} strokeWidth={2} className="net-detail-icon" />
                </div>
                <h2 className="net-detail-title">Connection Details</h2>
              </div>

              <div className="net-detail-rows">
                <div className="net-detail-row">
                  <span className="net-row-label">Protocol</span>
                  <span className="net-row-val">{mockNetworkInfo.protocol}</span>
                </div>
                <div className="net-detail-row">
                  <span className="net-row-label">Connection Type</span>
                  <span className="net-row-val">{mockNetworkInfo.connType}</span>
                </div>
                <div className="net-detail-row">
                  <span className="net-row-label">Local IP</span>
                  <span className="net-row-val">{mockNetworkInfo.lanIp}</span>
                </div>
                <div className="net-detail-row">
                  <span className="net-row-label">Server Port</span>
                  <span className="net-row-val">{mockNetworkInfo.serverPort}</span>
                </div>
                <div className="net-detail-row">
                  <span className="net-row-label">WebSocket URL</span>
                  <span className="net-row-val val-mono">{mockNetworkInfo.wsUrl}</span>
                </div>
              </div>
            </div>

            {/* Connection Status Card */}
            <div className="net-detail-card">
              <div className="net-detail-header">
                <div className="net-detail-icon-circle">
                  <Activity size={18} strokeWidth={2} className="net-detail-icon" />
                </div>
                <h2 className="net-detail-title">Connection Status</h2>
              </div>

              <div className="net-detail-rows">
                {Object.entries(mockConnectionStatus).map(([key, item]) => (
                  <div key={key} className="net-detail-row">
                    <span className="net-row-label-with-dot">
                      <span className="status-bullet online" />
                      {item.label}
                    </span>
                    <span className="net-row-val val-online">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
