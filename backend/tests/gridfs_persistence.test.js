import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = 'http://localhost:5000';

async function runTest() {
  console.log('Testing GridFS Persistence Across Ephemeral Container Rebuilds...');

  // 1. Register test user & login
  const username = `gridfs_user_${Date.now()}`;
  const password = 'StrongPassword123!';
  await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  // 2. Upload file
  const testContent = Buffer.from('Permanent file content stored in MongoDB GridFS!');
  const form = new FormData();
  form.append('file', new Blob([testContent], { type: 'text/plain' }), 'permanent_notes.txt');

  const uploadRes = await fetch(`${BASE_URL}/api/messages/upload-file`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const uploadData = await uploadRes.json();
  if (!uploadData.success || !uploadData.fileUrl) {
    throw new Error('Upload failed');
  }

  // 3. Delete file from local disk to simulate Render container restart/wipe
  const diskFilename = path.basename(uploadData.fileUrl);
  const localDiskPath = path.resolve(__dirname, '../../uploads', diskFilename);
  if (fs.existsSync(localDiskPath)) {
    fs.unlinkSync(localDiskPath);
    console.log('Simulated Render ephemeral disk wipe: deleted', diskFilename, 'from disk');
  }

  // 4. Request file via GET /uploads/:filename (inline)
  const inlineRes = await fetch(`${BASE_URL}${uploadData.fileUrl}`);
  if (inlineRes.status !== 200) {
    throw new Error(`Expected 200 from GridFS fallback, got ${inlineRes.status}`);
  }
  const inlineText = await inlineRes.text();
  if (inlineText !== 'Permanent file content stored in MongoDB GridFS!') {
    throw new Error(`Unexpected content: ${inlineText}`);
  }
  console.log('✓ Successfully recovered and streamed file from GridFS after disk deletion!');

  // 5. Request file via GET /uploads/:filename?download=1
  const dlRes = await fetch(`${BASE_URL}${uploadData.fileUrl}?download=1&name=permanent_notes.txt`);
  if (dlRes.status !== 200) {
    throw new Error(`Expected 200 for download from GridFS fallback, got ${dlRes.status}`);
  }
  const disp = dlRes.headers.get('content-disposition') || '';
  if (!disp.includes('attachment')) {
    throw new Error(`Expected attachment disposition, got: ${disp}`);
  }
  console.log('✓ Successfully downloaded file from GridFS with Content-Disposition attachment!');

  console.log('ALL GRIDFS PERSISTENCE TESTS PASSED!');
}

runTest().catch((err) => {
  console.error('GridFS Test Error:', err);
  process.exit(1);
});
