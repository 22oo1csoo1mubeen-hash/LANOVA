import WebSocket from 'ws';

/**
 * LANOVA Backend Milestone 2 Automated Test Suite
 * Tests:
 * 1. REST Message History API
 * 2. WebSocket Connection and Authentication
 * 3. Online/Offline Status Broadcasting
 * 4. Real-Time Private Messaging
 * 5. Offline Message Persistence
 * 6. WebSocket Payload Validation
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
        // ignore JSON parse errors
      }
    };

    ws.on('message', handler);
  });
}

async function runTests() {
  console.log('\n========================================');
  console.log('LANOVA Backend Milestone 2 Test Suite');
  console.log('========================================\n');

  try {
    const suffix = Math.floor(Math.random() * 90000) + 10000;
    const userA_name = `user_a_${suffix}`;
    const userB_name = `user_b_${suffix}`;
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

    // 2. Login User A and User B to obtain JWTs
    const loginA = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: userA_name, password }),
    });
    assert(loginA.status === 200, 'User A login succeeded');
    const tokenA = loginA.data.token;
    const userAId = loginA.data.user.id;

    const loginB = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: userB_name, password }),
    });
    assert(loginB.status === 200, 'User B login succeeded');
    const tokenB = loginB.data.token;
    const userBId = loginB.data.user.id;

    // 3. Test REST Message History API - Initial state
    const historyUnauth = await request(`/api/messages/${userBId}`);
    assert(historyUnauth.status === 401, 'REST /api/messages/:id rejects unauthenticated request with 401');

    const historyInvalidId = await request('/api/messages/invalid-id', {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(historyInvalidId.status === 400, 'REST /api/messages/:id rejects invalid ID with 400');

    const historyEmpty = await request(`/api/messages/${userBId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(historyEmpty.status === 200, 'REST /api/messages/:id returns 200 for valid users');
    assert(Array.isArray(historyEmpty.data.messages) && historyEmpty.data.messages.length === 0, 'Initial conversation history is empty');

    // 4. Test WebSocket Authentication: Reject invalid token
    await new Promise((resolve) => {
      const badWs = createWebSocketClient('invalid.jwt.token');
      badWs.on('close', (code) => {
        assert(code === 4001, 'WebSocket connection rejected with code 4001 for invalid JWT');
        resolve();
      });
      badWs.on('open', () => {
        // Should not remain open
      });
    });

    // 5. Connect User A via WebSocket
    const wsA = createWebSocketClient(tokenA);
    await new Promise((resolve, reject) => {
      wsA.on('open', resolve);
      wsA.on('error', reject);
    });
    assert(wsA.readyState === WebSocket.OPEN, 'User A WebSocket connected successfully');

    // Verify initial online snapshot
    const onlineSnapshotA = await waitForEvent(wsA, 'users:online');
    assert(Array.isArray(onlineSnapshotA.onlineUserIds), 'User A received initial online users list');
    assert(onlineSnapshotA.onlineUserIds.includes(userAId), 'User A is listed in onlineUserIds');

    // 6. Connect User B via WebSocket and verify online status broadcast
    const userBStatusPromise = waitForEvent(wsA, 'user:status');
    const wsB = createWebSocketClient(tokenB);
    await new Promise((resolve, reject) => {
      wsB.on('open', resolve);
      wsB.on('error', reject);
    });
    assert(wsB.readyState === WebSocket.OPEN, 'User B WebSocket connected successfully');

    const userBStatus = await userBStatusPromise;
    assert(userBStatus.userId === userBId && userBStatus.status === 'online', 'User A received status update that User B is online');

    const typingStartPromise = waitForEvent(wsB, 'typing:start');
    wsA.send(JSON.stringify({
      type: 'typing:start',
      payload: { receiverId: userBId },
    }));
    const typingStart = await typingStartPromise;
    assert(typingStart.senderId === userAId, 'Typing indicator is relayed with authenticated sender ID');

    const typingStopPromise = waitForEvent(wsB, 'typing:stop');
    wsA.send(JSON.stringify({
      type: 'typing:stop',
      payload: { receiverId: userBId },
    }));
    const typingStop = await typingStopPromise;
    assert(typingStop.senderId === userAId, 'Typing stopped event is relayed to the peer');

    // 7. Test Real-Time Private Messaging (User A -> User B)
    const textMsg1 = 'Hello User B! Welcome to LANOVA.';
    const sentPromiseA = waitForEvent(wsA, 'message:sent');
    const receivedPromiseB = waitForEvent(wsB, 'message:received');

    wsA.send(
      JSON.stringify({
        type: 'message:send',
        payload: {
          receiverId: userBId,
          content: textMsg1,
        },
      })
    );

    const sentAck = await sentPromiseA;
    assert(sentAck.status === 'saved' && sentAck.content === textMsg1, 'Sender received save acknowledgement (message:sent)');
    assert(sentAck.senderId === userAId && sentAck.receiverId === userBId, 'Sender acknowledgement contains correct sender and receiver IDs');

    const receivedMsg = await receivedPromiseB;
    assert(receivedMsg.content === textMsg1, 'Recipient received private message in real time (message:received)');
    assert(receivedMsg.senderId === userAId, 'Incoming message specifies correct senderId');
    assert(receivedMsg.id === sentAck.id, 'Message ID matches between sender ack and recipient delivery');

    const nextMessageSentPromise = waitForEvent(wsA, 'message:sent');
    const nextMessageReceivedPromise = waitForEvent(wsB, 'message:received');
    wsA.send(JSON.stringify({
      type: 'message:send',
      payload: { receiverId: userBId, content: 'A second message in the read batch.' },
    }));
    const [nextMessageAck] = await Promise.all([nextMessageSentPromise, nextMessageReceivedPromise]);
    assert(nextMessageAck.status === 'saved', 'A second message is saved before the read-through receipt');

    const deliveredReceiptPromise = waitForEvent(wsA, 'messages:receipt');
    wsB.send(JSON.stringify({
      type: 'message:delivered',
      payload: { messageId: sentAck.id },
    }));
    const deliveredReceipt = await deliveredReceiptPromise;
    assert(deliveredReceipt.status === 'delivered', 'Sender receives a persisted delivery receipt');
    assert(deliveredReceipt.messageIds.includes(sentAck.id), 'Delivery receipt references the delivered message');

    const readReceiptPromise = waitForEvent(wsA, 'messages:receipt');
    wsB.send(JSON.stringify({
      type: 'conversation:read',
      payload: { otherUserId: userAId, lastReadMessageId: nextMessageAck.id },
    }));
    const readReceipt = await readReceiptPromise;
    assert(readReceipt.status === 'read', 'Sender receives a persisted read receipt');
    assert(readReceipt.lastReadMessageId === nextMessageAck.id, 'Read receipt identifies the last-read message');

    // Test editing, reactions, and replies persist and synchronize in real time.
    const updatedEventPromise = waitForEvent(wsB, 'message:updated');
    const editRes = await request(`/api/messages/item/${sentAck.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ content: 'Edited message for User B.' }),
    });
    assert(editRes.status === 200, 'Sender can edit their own message');
    assert(editRes.data.message.content === 'Edited message for User B.', 'Edit response contains updated message content');
    assert(Boolean(editRes.data.message.editedAt), 'Edited message includes an edited timestamp');
    const updatedEvent = await updatedEventPromise;
    assert(updatedEvent.id === sentAck.id, 'Recipient receives real-time message edit');

    const unauthorizedEdit = await request(`/api/messages/item/${sentAck.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ content: 'Attempted unauthorized edit' }),
    });
    assert(unauthorizedEdit.status === 403, 'Recipient cannot edit the sender’s message');

    const reactionEventPromise = waitForEvent(wsA, 'message:reaction');
    const reactionRes = await request(`/api/messages/item/${sentAck.id}/reactions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ emoji: '❤️' }),
    });
    assert(reactionRes.status === 200, 'Conversation participant can react to a message');
    assert(
      reactionRes.data.reactions.some((reaction) => reaction.userId === userBId && reaction.emoji === '❤️'),
      'Reaction is persisted for the acting user'
    );
    const reactionEvent = await reactionEventPromise;
    assert(reactionEvent.messageId === sentAck.id, 'Sender receives real-time reaction update');

    const removeReaction = await request(`/api/messages/item/${sentAck.id}/reactions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ emoji: '❤️' }),
    });
    assert(removeReaction.status === 200 && removeReaction.data.reactions.length === 0, 'Tapping the same reaction removes it');

    const replyText = 'This is a reply to the edited message.';
    const replySentPromise = waitForEvent(wsA, 'message:sent');
    const replyReceivedPromise = waitForEvent(wsB, 'message:received');
    wsA.send(
      JSON.stringify({
        type: 'message:send',
        payload: {
          receiverId: userBId,
          content: replyText,
          replyToId: sentAck.id,
        },
      })
    );
    const [replyAck, receivedReply] = await Promise.all([replySentPromise, replyReceivedPromise]);
    assert(replyAck.replyTo?.messageId === sentAck.id, 'Reply references the original message');
    assert(replyAck.replyTo?.content === 'Edited message for User B.', 'Reply stores a snapshot of the quoted message');
    assert(receivedReply.replyTo?.senderId === userAId, 'Recipient receives reply metadata');

    // 8. Test Validation: Sending to self
    const errorPromiseSelf = waitForEvent(wsA, 'error');
    wsA.send(
      JSON.stringify({
        type: 'message:send',
        payload: {
          receiverId: userAId,
          content: 'Talking to myself',
        },
      })
    );
    const errSelf = await errorPromiseSelf;
    assert(errSelf.message.includes('Cannot send messages to yourself'), 'Server rejects message sent to oneself with clear error');

    // 9. Test Validation: Empty content
    const errorPromiseEmpty = waitForEvent(wsA, 'error');
    wsA.send(
      JSON.stringify({
        type: 'message:send',
        payload: {
          receiverId: userBId,
          content: '   ',
        },
      })
    );
    const errEmpty = await errorPromiseEmpty;
    assert(errEmpty.message.includes('cannot be empty'), 'Server rejects empty message content with clear error');

    // 10. Test Offline Messaging: User B disconnects, User A sends message
    const userBOfflinePromise = waitForEvent(wsA, 'user:status');
    wsB.close();

    const offlineStatus = await userBOfflinePromise;
    assert(offlineStatus.userId === userBId && offlineStatus.status === 'offline', 'User A received status update that User B is offline');

    // Send offline message while User B is disconnected
    const textMsg2 = 'This is an offline message while User B is away.';
    const offlineSentPromise = waitForEvent(wsA, 'message:sent');
    wsA.send(
      JSON.stringify({
        type: 'message:send',
        payload: {
          receiverId: userBId,
          content: textMsg2,
        },
      })
    );
    const offlineAck = await offlineSentPromise;
    assert(offlineAck.status === 'saved' && offlineAck.content === textMsg2, 'Offline message saved successfully in MongoDB');

    const receiverHistory = await request(`/api/messages/${userAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const deliveredOfflineMessage = receiverHistory.data.messages.find(
      (message) => message.id === offlineAck.id
    );
    assert(Boolean(deliveredOfflineMessage?.deliveredAt), 'Opening history marks offline messages as delivered');
    assert(!deliveredOfflineMessage?.readAt, 'History retrieval alone does not mark a message as read');

    // 11. Verify Message History Persistence via REST API
    const historyAfter = await request(`/api/messages/${userBId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(historyAfter.status === 200, 'Message history query succeeded');
    assert(historyAfter.data.messages.length === 4, 'Message history contains all messages in order');
    assert(historyAfter.data.messages[0].content === 'Edited message for User B.', 'Edited content is persisted in conversation history');
    assert(Boolean(historyAfter.data.messages[0].deliveredAt), 'Delivery receipt is persisted in message history');
    assert(Boolean(historyAfter.data.messages[0].readAt), 'Read receipt is persisted in message history');
    assert(Boolean(historyAfter.data.messages[1].readAt), 'Read-through receipt also marks earlier messages as read');
    assert(historyAfter.data.messages[2].content === replyText, 'Reply is preserved in chronological order');
    assert(!historyAfter.data.messages[2].readAt, 'Read-through receipt does not mark later messages as read');
    assert(historyAfter.data.messages[2].replyTo?.messageId === sentAck.id, 'Reply relationship is persisted in history');
    assert(historyAfter.data.messages[3].content === textMsg2, 'Offline message remains in chronological order');

    // 12. Test DELETE /api/messages/:userId (Clear Conversation)
    const clearRes = await request(`/api/messages/${userBId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(clearRes.status === 200, 'DELETE /api/messages/:userId succeeds with 200');
    assert(clearRes.data.success === true, 'DELETE response indicates success');
    assert(clearRes.data.deletedCount >= 3, 'DELETE removed messages from MongoDB');

    // Verify history is now empty after clear
    const historyCleared = await request(`/api/messages/${userBId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(historyCleared.data.messages.length === 0, 'Conversation history is empty after clear');

    // Close remaining socket
    wsA.close();

    console.log('\n========================================');
    if (failed === 0) {
      console.log(`ALL ${passed} BACKEND MILESTONE 2 TESTS PASSED!`);
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
