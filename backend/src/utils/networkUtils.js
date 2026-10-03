import os from 'os';

/**
 * Network Utilities — LANOVA Milestone 3
 * Inspects host network interfaces, identifies local IPv4 LAN addresses,
 * and resolves client connection information.
 */

/**
 * Retrieve all active, non-internal IPv4 network interfaces on the host machine.
 * @returns {Array<{ name: string, address: string, netmask: string, mac: string, family: string, internal: boolean }>}
 */
export function getNetworkInterfaces() {
  const allInterfaces = os.networkInterfaces();
  const validInterfaces = [];

  for (const [name, netList] of Object.entries(allInterfaces)) {
    if (!netList) continue;

    for (const net of netList) {
      // Look for non-internal IPv4 addresses only
      const isIPv4 = net.family === 'IPv4' || net.family === 4;
      if (isIPv4 && !net.internal) {
        validInterfaces.push({
          name,
          address: net.address,
          netmask: net.netmask,
          mac: net.mac,
          family: 'IPv4',
          internal: false,
          cidr: net.cidr,
        });
      }
    }
  }

  return validInterfaces;
}

/**
 * Choose the primary LAN IPv4 address from available interfaces.
 * Prefers standard private network ranges (192.168.*, 10.*, 172.16-31.*)
 * and physical adapters (Wi-Fi, Ethernet) over virtual adapters.
 * @param {Array} interfaces
 * @returns {string} Primary LAN IPv4 address (or '127.0.0.1' if none found)
 */
export function getPrimaryLanIp(interfaces = null) {
  const candidateList = interfaces || getNetworkInterfaces();
  if (candidateList.length === 0) {
    return '127.0.0.1';
  }

  // Filter out known virtual / VM adapters if real physical adapters exist
  const physicalCandidates = candidateList.filter((iface) => {
    const lowerName = iface.name.toLowerCase();
    return (
      !lowerName.includes('vethernet') &&
      !lowerName.includes('virtualbox') &&
      !lowerName.includes('vmware') &&
      !lowerName.includes('wsl')
    );
  });

  const listToSearch = physicalCandidates.length > 0 ? physicalCandidates : candidateList;

  // 1. Prefer standard 192.168.* LAN addresses (standard home/office Wi-Fi)
  const homeLan = listToSearch.find((i) => i.address.startsWith('192.168.'));
  if (homeLan) return homeLan.address;

  // 2. Prefer 10.* private network addresses
  const classA = listToSearch.find((i) => i.address.startsWith('10.'));
  if (classA) return classA.address;

  // 3. Prefer 172.16.* - 172.31.* private network addresses
  const classB = listToSearch.find((i) => {
    const parts = i.address.split('.');
    if (parts[0] === '172') {
      const secondOctet = parseInt(parts[1], 10);
      return secondOctet >= 16 && secondOctet <= 31;
    }
    return false;
  });
  if (classB) return classB.address;

  // 4. Default to first available candidate address
  return listToSearch[0].address;
}

/**
 * Normalize and clean remote client IP address from request socket.
 * Strips IPv4-mapped IPv6 prefixes (e.g. "::ffff:192.168.0.11" -> "192.168.0.11").
 * @param {http.IncomingMessage} req
 * @returns {string} Clean client IPv4 or loopback address
 */
export function getClientIp(req) {
  let rawIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';

  // Normalize IPv6 loopback
  if (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }

  // Strip IPv4-mapped IPv6 prefix
  if (rawIp.startsWith('::ffff:')) {
    rawIp = rawIp.substring(7);
  }

  return rawIp;
}
