import os from 'os';
import mongoose from 'mongoose';
import { getNetworkInterfaces, getPrimaryLanIp, getClientIp } from '../utils/networkUtils.js';
import { connectionManager } from '../sockets/connectionManager.js';

/**
 * Network Controller — LANOVA Milestone 3
 * Handles Network Information and System Health endpoints.
 */

/**
 * Retrieve comprehensive network details for the LANOVA host server.
 * GET /api/network/info
 */
export async function getNetworkInfo(req, res) {
  try {
    const port = parseInt(process.env.PORT, 10) || 5000;
    const interfaces = getNetworkInterfaces();
    const primaryLanIp = getPrimaryLanIp(interfaces);
    const clientIp = getClientIp(req);

    // Locate primary interface to extract subnet mask and MAC address
    const primaryInterface =
      interfaces.find((i) => i.address === primaryLanIp) || interfaces[0] || null;

    const subnet = primaryInterface?.netmask || '255.255.255.0';
    const activeUsers = connectionManager.getOnlineUserIds().length;

    const response = {
      server: {
        hostname: os.hostname(),
        port,
        protocol: 'HTTP',
        websocketProtocol: 'WS',
        status: 'online',
        uptimeSeconds: Math.floor(process.uptime()),
      },
      client: {
        ip: clientIp,
        family: 'IPv4',
      },
      network: {
        lanIp: primaryLanIp,
        subnet,
        activeUsers,
        interfaceName: primaryInterface?.name || 'Local Area Network',
        mac: primaryInterface?.mac || null,
        lanUrl: `http://${primaryLanIp}:${port}`,
        websocketLanUrl: `ws://${primaryLanIp}:${port}/ws`,
      },
      interfaces: interfaces.map((i) => ({
        name: i.name,
        address: i.address,
        netmask: i.netmask,
        family: i.family,
      })),
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      },
      status: 'ok',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[NetworkController] Error retrieving network info:', error.message);
    res.status(500).json({ message: 'Failed to retrieve network information' });
  }
}

/**
 * Enhanced Health Check Endpoint
 * GET /api/health
 */
export function getHealth(_req, res) {
  const dbConnected = mongoose.connection.readyState === 1;

  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    server: 'running',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
}
