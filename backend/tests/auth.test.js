/**
 * Automated test runner for LANOVA Backend Milestone 1
 * Tests Registration, Login, JWT verification, and Protected User Listing.
 */

const BASE_URL = 'http://127.0.0.1:5000';

let testResults = [];

function assert(condition, message) {
  if (condition) {
    testResults.push({ status: 'PASS', message });
    console.log(`✓ PASS: ${message}`);
  } else {
    testResults.push({ status: 'FAIL', message });
    console.error(`✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('LANOVA Backend Milestone 1 Test Suite');
  console.log('========================================\n');

  // Test 1: Health Check
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200, 'Health check returns status 200');
  assert(healthData.status === 'ok', 'Health check status is "ok"');

  const randomSuffix = Math.floor(Math.random() * 100000);
  const username1 = `mubeen_${randomSuffix}`;
  const username2 = `alex_${randomSuffix}`;
  const password = 'StrongPassword123!';

  // Test 2: User 1 Registration (Valid)
  const reg1Res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username1, password }),
  });
  const reg1Data = await reg1Res.json();
  assert(reg1Res.status === 201, 'Registration returns status 201 Created');
  assert(reg1Data.user && reg1Data.user.username === username1, 'Returned user has correct username');
  assert(!reg1Data.user.passwordHash && !reg1Data.user.password, 'Password/hash is NEVER returned in response');

  // Test 3: Duplicate Username Registration
  const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username1, password }),
  });
  assert(dupRes.status === 409, 'Duplicate username registration returns status 409 Conflict');

  // Test 4: Registration with Empty Username
  const emptyUserRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: '   ', password }),
  });
  assert(emptyUserRes.status === 400, 'Empty username registration returns status 400 Bad Request');

  // Test 5: Registration with Short Password (< 6 chars)
  const shortPassRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: `short_${randomSuffix}`, password: '123' }),
  });
  assert(shortPassRes.status === 400, 'Short password registration returns status 400 Bad Request');

  // Test 6: Registration with Invalid Characters in Username
  const invalidUserRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bad user!', password }),
  });
  assert(invalidUserRes.status === 400, 'Invalid character username returns status 400 Bad Request');

  // Test 7: Login with Valid Credentials
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username1, password }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, 'Valid login returns status 200 OK');
  assert(typeof loginData.token === 'string' && loginData.token.length > 20, 'JWT token is generated and returned');
  assert(loginData.user && loginData.user.username === username1, 'User details match authenticated user');

  const token1 = loginData.token;

  // Test 8: Login with Incorrect Password
  const wrongPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username1, password: 'WrongPassword999!' }),
  });
  assert(wrongPassRes.status === 401, 'Incorrect password returns status 401 Unauthorized');

  // Test 9: Login with Nonexistent Username
  const noUserRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'nonexistent_user_9999', password }),
  });
  assert(noUserRes.status === 401, 'Nonexistent username returns status 401 Unauthorized');

  // Test 10: Access /api/auth/me with Valid Token
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const meData = await meRes.json();
  assert(meRes.status === 200, 'Protected /api/auth/me returns status 200 with valid JWT');
  assert(meData.user.username === username1, '/api/auth/me returns correct user data');

  // Test 11: Access /api/auth/me without Token
  const noTokenRes = await fetch(`${BASE_URL}/api/auth/me`);
  assert(noTokenRes.status === 401, 'Protected /api/auth/me rejects requests without token with 401');

  // Test 12: Access /api/auth/me with Malformed/Invalid Token
  const badTokenRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: 'Bearer thisisabadtoken123' },
  });
  assert(badTokenRes.status === 401, 'Protected /api/auth/me rejects invalid token with 401');

  // Test 13: Register a Second User
  const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username2, password }),
  });
  assert(reg2Res.status === 201, 'Second user registered successfully');

  // Test 14: User Listing API (/api/users)
  const usersRes = await fetch(`${BASE_URL}/api/users`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const usersData = await usersRes.json();
  assert(usersRes.status === 200, '/api/users returns status 200');
  assert(Array.isArray(usersData.users), 'users property is an Array');

  // Verify caller (username1) is excluded from the listing
  const hasCaller = usersData.users.some((u) => u.username === username1);
  assert(!hasCaller, 'Current authenticated user is excluded from user listing');

  // Verify username2 is included
  const hasUser2 = usersData.users.some((u) => u.username === username2);
  assert(hasUser2, 'Other registered user is included in user listing');

  // Verify no password hashes are exposed
  const hasLeak = usersData.users.some((u) => u.passwordHash || u.password);
  assert(!hasLeak, 'No password hashes exposed in user listing API');

  console.log('\n========================================');
  console.log(`ALL ${testResults.length} BACKEND TESTS PASSED SUCCESSFULLY!`);
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('\nTest execution failed:', err);
  process.exit(1);
});
