import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';

/**
 * LANOVA File Sharing & Chat Fixes Automated Test Suite
 * Tests:
 * 1. Storage & retrieval of large number of messages (no 100-message cutoff bug)
 * 2. Generic file upload (/api/messages/upload-file) with various extensions (.pdf, .zip, .docx)
 * 3. Real-time WebSocket transmission of file messages
 * 4. Single message deletion (/api/messages/item/:messageId) with disk cleanup
 * 5. Full conversation deletion (/api/messages/:userId) with disk cleanup & peer notification
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

async function runTests() {
  console.log('\n========================================');
  console.log('LANOVA File Sharing & Chat Fixes Test Suite');
  console.log('========================================\n');

  try {
    const suffix = Math.floor(Math.random() * 90000) + 10000;
    const userA_name = `file_user_a_${suffix}`;
    const userB_name = `file_user_b_${suffix}`;
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

    // 3. Connect WebSockets
    const wsA = createWebSocketClient(tokenA);
    const wsB = createWebSocketClient(tokenB);

    await Promise.all([
      waitForEvent(wsA, 'users:online'),
      waitForEvent(wsB, 'users:online'),
    ]);
    assert(wsA.readyState === WebSocket.OPEN && wsB.readyState === WebSocket.OPEN, 'Both WebSockets connected');

    // 4. Test Chat History with > 100 messages (verifying bug fix: messages 101+ are stored and returned)
    console.log('\n--- Testing message history storage beyond 100 messages ---');
    // Seed 105 messages directly via MongoDB or WebSocket
    // Let's send 105 messages rapidly
    const totalMsgs = 105;
    for (let i = 1; i <= totalMsgs; i++) {
      const ackPromise = waitForEvent(wsA, 'message:sent');
      wsA.send(
        JSON.stringify({
          type: 'message:send',
          payload: {
            receiverId: userBId,
            content: `Message sequence #${i}`,
          },
        })
      );
      await ackPromise;
    }

    const historyRes = await request(`/api/messages/${userBId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(historyRes.status === 200, 'Conversation history query succeeded');
    assert(
      historyRes.data.messages.length === totalMsgs,
      `All ${totalMsgs} messages returned (not capped at 100)`
    );
    assert(
      historyRes.data.messages[0].content === 'Message sequence #1',
      'First message preserved chronologically'
    );
    assert(
      historyRes.data.messages[totalMsgs - 1].content === `Message sequence #${totalMsgs}`,
      `Last message sequence #${totalMsgs} is returned and displayed`
    );

    // 5. Test Generic File Upload (PDF, ZIP, DOCX, APK, etc.)
    console.log('\n--- Testing generic file upload with any extension ---');
    const dummyPdfContent = Buffer.from('%PDF-1.4 dummy pdf content for testing lanova document sharing');
    const pdfForm = new FormData();
    const pdfBlob = new Blob([dummyPdfContent], { type: 'application/pdf' });
    pdfForm.append('file', pdfBlob, 'project_report.pdf');

    const pdfUploadRes = await fetch(`${BASE_URL}/api/messages/upload-file`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: pdfForm,
    });
    const pdfData = await pdfUploadRes.json();
    assert(pdfUploadRes.status === 201, 'PDF file uploaded successfully with HTTP 201');
    assert(pdfData.success === true, 'Upload response indicates success');
    assert(Boolean(pdfData.fileUrl), 'Upload response contains fileUrl');
    assert(pdfData.fileUrl.startsWith('/uploads/'), 'fileUrl points to /uploads path');
    assert(pdfData.fileMeta?.fileName === 'project_report.pdf', 'fileMeta retains original PDF filename');
    assert(pdfData.fileMeta?.extension === '.pdf', 'fileMeta includes .pdf extension');

    // Test static view (inline open) of the uploaded PDF
    const staticPdfRes = await fetch(`${BASE_URL}${pdfData.fileUrl}`);
    assert(staticPdfRes.status === 200, 'Uploaded PDF is statically retrievable via HTTP');
    const inlineDisp = staticPdfRes.headers.get('content-disposition') || '';
    assert(!inlineDisp.includes('attachment'), 'Inline view does not force attachment download');

    // Test direct local download of the uploaded PDF with ?download=1
    const downloadPdfRes = await fetch(`${BASE_URL}${pdfData.fileUrl}?download=1&name=project_report.pdf`);
    assert(downloadPdfRes.status === 200, 'Download endpoint returns HTTP 200');
    const attachDisp = downloadPdfRes.headers.get('content-disposition') || '';
    assert(attachDisp.includes('attachment'), 'Download endpoint returns Content-Disposition: attachment');
    assert(attachDisp.includes('project_report.pdf'), 'Download header includes original filename');

    // Test ZIP file upload
    const dummyZipContent = Buffer.from('PK\x03\x04 dummy zip archive');
    const zipForm = new FormData();
    const zipBlob = new Blob([dummyZipContent], { type: 'application/zip' });
    zipForm.append('file', zipBlob, 'code_archive.zip');

    const zipUploadRes = await fetch(`${BASE_URL}/api/messages/upload-file`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: zipForm,
    });
    const zipData = await zipUploadRes.json();
    assert(zipUploadRes.status === 201, 'ZIP archive uploaded successfully with HTTP 201');
    assert(zipData.fileMeta?.extension === '.zip', 'fileMeta includes .zip extension');

    // 6. Test Real-time Transmission of File Message over WebSocket
    console.log('\n--- Testing real-time file sharing over WebSocket ---');
    const sentFilePromiseA = waitForEvent(wsA, 'message:sent');
    const receivedFilePromiseB = waitForEvent(wsB, 'message:received');

    wsA.send(
      JSON.stringify({
        type: 'message:send',
        payload: {
          receiverId: userBId,
          content: 'Here is the project specification PDF document',
          messageType: 'file',
          fileUrl: pdfData.fileUrl,
          fileMeta: pdfData.fileMeta,
        },
      })
    );

    const [sentFileAck, receivedFileMsg] = await Promise.all([
      sentFilePromiseA,
      receivedFilePromiseB,
    ]);

    assert(sentFileAck.status === 'saved', 'Sender received saved ack for file message');
    assert(sentFileAck.messageType === 'file', 'Sender ack specifies messageType "file"');
    assert(sentFileAck.fileUrl === pdfData.fileUrl, 'Sender ack retains fileUrl');
    assert(receivedFileMsg.senderId === userAId, 'Recipient received file message from User A');
    assert(receivedFileMsg.content === 'Here is the project specification PDF document', 'Recipient received file caption');
    assert(receivedFileMsg.fileUrl === pdfData.fileUrl, 'Recipient received fileUrl');
    assert(receivedFileMsg.fileMeta?.fileName === 'project_report.pdf', 'Recipient received file metadata');

    const fileMessageId = sentFileAck.id;

    // 7. Test Single Message Deletion (DELETE /api/messages/item/:messageId)
    console.log('\n--- Testing single message deletion ---');
    const peerDeleteEventPromise = waitForEvent(wsB, 'message:deleted');

    const deleteItemRes = await request(`/api/messages/item/${fileMessageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(deleteItemRes.status === 200, 'DELETE /api/messages/item/:id returned HTTP 200');
    assert(deleteItemRes.data.success === true, 'Response indicates single message deleted');

    const peerDeleteEvent = await peerDeleteEventPromise;
    assert(peerDeleteEvent.messageId === fileMessageId, 'Peer received real-time message:deleted event over WebSocket');

    // Verify file was removed from disk
    const diskPath = path.resolve('uploads', path.basename(pdfData.fileUrl));
    assert(!fs.existsSync(diskPath), 'Associated uploaded file was deleted from disk upon message deletion');

    // 8. Test Delete Entire Chat (DELETE /api/messages/:userId) with real-time peer event
    console.log('\n--- Testing delete entire chat with peer notification ---');
    const peerClearEventPromise = waitForEvent(wsB, 'conversation:cleared');

    const clearRes = await request(`/api/messages/${userBId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(clearRes.status === 200, 'DELETE /api/messages/:userId returned HTTP 200');
    assert(clearRes.data.deletedCount >= 105, 'All conversation messages deleted from MongoDB');

    const peerClearEvent = await peerClearEventPromise;
    assert(peerClearEvent.clearedByUserId === userAId, 'Peer received real-time conversation:cleared event over WebSocket');

    // Verify conversation history is now completely 0
    const historyFinal = await request(`/api/messages/${userBId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(historyFinal.data.messages.length === 0, 'Conversation history is completely empty after delete chat');

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
