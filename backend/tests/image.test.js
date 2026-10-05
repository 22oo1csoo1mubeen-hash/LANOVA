import WebSocket from 'ws';

/**
 * LANOVA Image Sharing Automated Test Suite
 * Tests:
 * 1. Image upload authentication & validation
 * 2. Successful image file upload to /api/messages/upload
 * 3. Static serving of uploaded images via /uploads/:file
 * 4. Real-time WebSocket transmission of image messages
 * 5. Caption support (optional text + image)
 * 6. Conversation history persistence for image messages
 */

const BASE_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000/ws';

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

async function request(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function createWebSocketClient(token) {
  const url = token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL;
  return new WebSocket(url);
}

function waitForEvent(ws, eventType, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event "${eventType}"`));
    }, timeoutMs);

    const handler = (raw) => {
      try {
        const parsed = JSON.parse(raw.toString());
        if (parsed.type === eventType) {
          clearTimeout(timer);
          ws.removeListener('message', handler);
          resolve(parsed.payload);
        }
      } catch (err) {
        // ignore parse error
      }
    };

    ws.on('message', handler);
  });
}

// 1x1 transparent PNG buffer
const TINY_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

async function runTests() {
  console.log('\n========================================');
  console.log('LANOVA Image Sharing Test Suite');
  console.log('========================================\n');

  try {
    const suffix = Math.floor(Math.random() * 90000) + 10000;
    const userA_name = `img_user_a_${suffix}`;
    const userB_name = `img_user_b_${suffix}`;
    const password = 'Password123!';

    // 1. Register User A and User B
    const regA = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: userA_name, password }),
    });
    assert(regA.status === 201, 'User A registered successfully');

    const regB = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: userB_name, password }),
    });
    assert(regB.status === 201, 'User B registered successfully');

    // 2. Login User A and User B
    const loginA = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: userA_name, password }),
    });
    const tokenA = loginA.data.token;
    const userAId = loginA.data.user.id;

    const loginB = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: userB_name, password }),
    });
    const tokenB = loginB.data.token;
    const userBId = loginB.data.user.id;

    // 3. Test Unauthorized Image Upload
    const unauthUploadRes = await fetch(`${BASE_URL}/api/messages/upload`, {
      method: 'POST',
    });
    assert(unauthUploadRes.status === 401, 'Upload rejects unauthenticated request with 401');

    // 4. Test Upload Without File
    const noFileForm = new FormData();
    const noFileRes = await fetch(`${BASE_URL}/api/messages/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: noFileForm,
    });
    assert(noFileRes.status === 400, 'Upload rejects request with no file attached');

    // 5. Test Successful Image Upload
    const validForm = new FormData();
    const blob = new Blob([TINY_PNG_BUFFER], { type: 'image/png' });
    validForm.append('image', blob, 'lanova_test_photo.png');

    const uploadRes = await fetch(`${BASE_URL}/api/messages/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: validForm,
    });
    const uploadData = await uploadRes.json();
    assert(uploadRes.status === 201, 'Image uploaded successfully with HTTP 201');
    assert(uploadData.success === true, 'Upload response indicates success');
    assert(Boolean(uploadData.imageUrl), 'Upload response contains imageUrl');
    assert(uploadData.imageUrl.startsWith('/uploads/'), 'imageUrl points to /uploads path');
    assert(uploadData.imageMeta?.fileName === 'lanova_test_photo.png', 'imageMeta retains original filename');

    // 6. Test Static Image Serving
    const staticImageRes = await fetch(`${BASE_URL}${uploadData.imageUrl}`);
    assert(staticImageRes.status === 200, 'Uploaded image is accessible via static HTTP route');
    const imageContentType = staticImageRes.headers.get('content-type');
    assert(imageContentType.includes('image/png'), 'Static image served with correct image/png content-type');

    // 7. Test Real-time Image Message Transmission via WebSocket
    const wsA = createWebSocketClient(tokenA);
    const wsB = createWebSocketClient(tokenB);

    await Promise.all([
      waitForEvent(wsA, 'users:online'),
      waitForEvent(wsB, 'users:online'),
    ]);

    // Send image message from A to B with caption
    const receivedPromiseB = waitForEvent(wsB, 'message:received');
    const sentPromiseA = waitForEvent(wsA, 'message:sent');

    wsA.send(
      JSON.stringify({
        type: 'message:send',
        payload: {
          receiverId: userBId,
          content: 'Here is the network architecture diagram',
          messageType: 'image',
          imageUrl: uploadData.imageUrl,
          imageMeta: uploadData.imageMeta,
        },
      })
    );

    const [sentAck, receivedMsg] = await Promise.all([sentPromiseA, receivedPromiseB]);

    assert(sentAck.status === 'saved', 'Sender received saved acknowledgement for image message');
    assert(sentAck.messageType === 'image', 'Sender ack specifies messageType image');
    assert(sentAck.imageUrl === uploadData.imageUrl, 'Sender ack retains imageUrl');
    assert(receivedMsg.senderId === userAId, 'Recipient received image message from User A');
    assert(receivedMsg.content === 'Here is the network architecture diagram', 'Recipient received image caption');
    assert(receivedMsg.imageUrl === uploadData.imageUrl, 'Recipient received imageUrl');
    assert(receivedMsg.imageMeta?.fileName === 'lanova_test_photo.png', 'Recipient received image metadata');

    // 8. Test Image Message Without Caption (pure image)
    const receivedPromiseB_noCaption = waitForEvent(wsB, 'message:received');
    const sentPromiseA_noCaption = waitForEvent(wsA, 'message:sent');

    wsA.send(
      JSON.stringify({
        type: 'message:send',
        payload: {
          receiverId: userBId,
          content: '',
          messageType: 'image',
          imageUrl: uploadData.imageUrl,
        },
      })
    );

    const [sentAck2, receivedMsg2] = await Promise.all([sentPromiseA_noCaption, receivedPromiseB_noCaption]);
    assert(sentAck2.imageUrl === uploadData.imageUrl, 'Sender ack succeeded for image message without caption');
    assert(receivedMsg2.content === '', 'Recipient received empty caption as expected');
    assert(receivedMsg2.imageUrl === uploadData.imageUrl, 'Recipient received image URL without caption');

    // 9. Verify Image Messages in Conversation History REST API
    const historyRes = await request(`/api/messages/${userBId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(historyRes.status === 200, 'Conversation history query succeeded');
    const msgs = historyRes.data.messages;
    assert(msgs.length >= 2, 'History contains both image messages');
    const imgMsg = msgs.find((m) => m.imageUrl === uploadData.imageUrl);
    assert(Boolean(imgMsg), 'Image message is persisted in MongoDB and retrieved via history');
    assert(imgMsg.messageType === 'image', 'Persisted message has messageType image');

    wsA.close();
    wsB.close();

    console.log('\n========================================');
    console.log(`RESULTS: ${passed} passed, ${failed} failed`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
