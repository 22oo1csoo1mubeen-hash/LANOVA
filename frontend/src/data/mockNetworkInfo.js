// LANOVA — Mock network information
// Replace with real backend data during integration.

export const mockNetworkInfo = {
  lanIp:       '192.168.1.10',
  serverPort:  5000,
  subnet:      '255.255.255.0',
  wsStatus:    'Connected',   // 'Connected' | 'Disconnected' | 'Connecting'
  activeUsers: 5,
  protocol:    'TCP (WebSocket over HTTP)',
  connType:    'LAN (Local Area Network)',
  serverPort2: 5000,
  wsUrl:       'ws://192.168.1.10:5000',
};

export const mockConnectionStatus = {
  serverRunning:    { label: 'Server Running',    value: 'Online'     },
  dbConnected:      { label: 'Database Connected', value: 'Connected' },
  wsServer:         { label: 'WebSocket Server',   value: 'Active'    },
  yourConnection:   { label: 'Your Connection',    value: 'Connected' },
};
