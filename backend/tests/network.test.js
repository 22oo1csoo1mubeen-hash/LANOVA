import { getNetworkInterfaces, getPrimaryLanIp, getClientIp } from '../src/utils/networkUtils.js';

/**
 * LANOVA Backend Milestone 3 Automated Test Suite
 * Tests:
 * 1. Network Interface Inspection & IPv4 Detection
 * 2. Primary LAN IP Selection Algorithm
 * 3. Client IP Address Normalization
 * 4. GET /api/health Endpoint
 * 5. GET /api/network/info Protected Endpoint
 * 6. LAN CORS Header Compatibility
 */

const BASE_URL = 'http://localhost:5000';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('LANOVA Backend Milestone 3 Test Suite');
  console.log('========================================\n');

  try {
    // 1. Test Network Utilities (Unit Tests)
    const interfaces = getNetworkInterfaces();
    assert(Array.isArray(interfaces), 'getNetworkInterfaces() returns an Array');
    for (const iface of interfaces) {
      assert(iface.family === 'IPv4', `Interface ${iface.name} has family IPv4`);
      assert(iface.internal === false, `Interface ${iface.name} is non-internal`);
      assert(iface.address && iface.netmask, `Interface ${iface.name} has address and netmask`);
    }

    const primaryIp = getPrimaryLanIp(interfaces);
    assert(typeof primaryIp === 'string' && primaryIp.length > 0, `Primary LAN IP detected: ${primaryIp}`);
    assert(!primaryIp.startsWith('127.') || interfaces.length === 0, 'Primary LAN IP is not loopback if physical adapters exist');

    // Test getClientIp normalization
    const fakeReq1 = { socket: { remoteAddress: '::ffff:192.168.1.55' }, headers: {} };
    assert(getClientIp(fakeReq1) === '192.168.1.55', 'getClientIp strips ::ffff: prefix from IPv4-mapped IPv6');

    const fakeReq2 = { socket: { remoteAddress: '::1' }, headers: {} };
    assert(getClientIp(fakeReq2) === '127.0.0.1', 'getClientIp normalizes IPv6 loopback ::1 to 127.0.0.1');

    // 2. Test GET /api/health
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    assert(healthRes.status === 200, 'GET /api/health returns HTTP 200');
    const healthData = await healthRes.json();
    assert(healthData.status === 'ok', 'Health status is "ok"');
    assert(healthData.server === 'running', 'Health reports server is running');
    assert(healthData.database === 'connected', 'Health reports database is connected');

    // 3. Test GET /api/network/info (Unauthorized)
    const unauthRes = await fetch(`${BASE_URL}/api/network/info`);
    assert(unauthRes.status === 401, 'GET /api/network/info rejects unauthenticated requests with 401');

    // 4. Register and Login a user to test authenticated network info
    const testUsername = `net_tester_${Date.now()}`;
    const password = 'Password123!';

    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUsername, password }),
    });

    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testUsername, password }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // 5. Test GET /api/network/info (Authorized)
    const netRes = await fetch(`${BASE_URL}/api/network/info`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(netRes.status === 200, 'GET /api/network/info returns HTTP 200 with valid JWT');
    const netData = await netRes.json();

    assert(netData.status === 'ok', 'Network info status is "ok"');
    assert(Boolean(netData.server?.hostname), `Server hostname reported: ${netData.server?.hostname}`);
    assert(netData.server?.port === 5000, 'Server port reported correctly as 5000');
    assert(netData.server?.protocol === 'HTTP', 'Server protocol is HTTP');
    assert(netData.server?.websocketProtocol === 'WS', 'WebSocket protocol is WS');
    assert(Boolean(netData.network?.lanIp), `Network reports LAN IP: ${netData.network?.lanIp}`);
    assert(Boolean(netData.network?.subnet), `Network reports Subnet mask: ${netData.network?.subnet}`);
    assert(netData.network?.lanUrl.includes(':5000'), `LAN URL generated: ${netData.network?.lanUrl}`);
    assert(netData.network?.websocketLanUrl.startsWith('ws://'), `WebSocket LAN URL generated: ${netData.network?.websocketLanUrl}`);
    assert(netData.database?.status === 'connected', 'Database reported as connected');
    assert(netData.client?.ip === '127.0.0.1' || netData.client?.ip?.length > 0, `Client IP reported: ${netData.client?.ip}`);

    // 6. Test LAN CORS Headers
    const lanOrigin = 'http://192.168.0.25:5173';
    const corsRes = await fetch(`${BASE_URL}/api/health`, {
      headers: { Origin: lanOrigin },
    });
    assert(
      corsRes.headers.get('access-control-allow-origin') === lanOrigin,
      'CORS middleware permits LAN device origins (192.168.*)'
    );

    console.log('\n========================================');
    if (failed === 0) {
      console.log(`ALL ${passed} BACKEND MILESTONE 3 TESTS PASSED!`);
    } else {
      console.log(`TESTS FINISHED: ${passed} passed, ${failed} failed`);
    }
    console.log('========================================\n');
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  }
}

runTests();
