# LANOVA Backend ⚙️

> **High-Performance Express & Native WebSocket Server for LAN Real-Time Messaging.**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Native%20ws-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)

---

## 📖 Overview

The **LANOVA Backend** is an event-driven server application built with **Node.js**, **Express**, and the native **ws** WebSocket library. It manages user authentication, persistent chat history in **MongoDB**, real-time peer-to-peer message routing over TCP sockets, active peer presence tracking, and dynamic LAN IP/subnet discovery for local network demonstrations.

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & reconnect logic with Mongoose
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, and profile retrieval
│   │   ├── messageController.js  # Message history fetching, file uploads, conversation & message deletion
│   │   ├── networkController.js  # Health check & LAN network telemetry
│   │   └── userController.js     # Registered user directory (excluding current user)
│   ├── middleware/
│   │   ├── authMiddleware.js     # Express JWT bearer token validation
│   │   ├── uploadMiddleware.js   # Multer storage configuration for images (10MB) & any file extension (100MB)
│   │   └── errorMiddleware.js    # 404 handler and centralized error pipeline
│   ├── models/
│   │   ├── Message.js            # Mongoose schema for persistent private messages (text, image, file)
│   │   ├── Conversation.js       # Shared conversation metadata and wallpaper
│   │   └── User.js               # Mongoose schema for user accounts & bcrypt hashing
│   ├── routes/
│   │   ├── authRoutes.js         # Routes for /api/auth (register, login, me)
│   │   ├── messageRoutes.js      # Routes for /api/messages (history, uploads, deletions)
│   │   ├── networkRoutes.js      # Routes for /api/network/info
│   │   └── userRoutes.js         # Routes for /api/users
│   ├── sockets/
│   │   ├── connectionManager.js  # In-memory registry of active authenticated sockets
│   │   ├── socketAuth.js         # Token extraction & verification for WebSocket handshake
│   │   ├── socketHandlers.js     # Event dispatchers (messaging, receipts, typing, presence)
│   │   └── socketServer.js       # WebSocketServer setup, ping/pong heartbeats & lifecycle
│   ├── utils/
│   │   ├── generateToken.js      # JWT signing utility
│   │   └── networkUtils.js       # OS network interfaces inspection & LAN IP resolution
│   ├── app.js                    # Express app initialization, Helmet, CORS, static uploads & middleware
│   └── server.js                 # HTTP & WebSocket server entrypoint (binds to 0.0.0.0)
├── uploads/                      # Dedicated on-disk storage directory for shared photos and documents
├── tests/
│   ├── auth.test.js              # Automated tests for authentication & user listing (Milestone 1)
│   ├── chat.test.js              # Automated tests for WebSocket messaging & persistence (Milestone 2)
│   ├── network.test.js           # Automated tests for LAN IP detection & telemetry (Milestone 3)
│   ├── image_upload.test.js      # Automated tests for image uploading, storage & disk cleanup
│   └── file_and_chat_fixes.test.js # Automated tests for generic file sharing, paginated history & deletions
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies and npm scripts
└── README.md                     # This backend documentation file
```

---

## ⚡ Core Modules & Milestones

### 1. Authentication & Security
- **Registration**: Validates username (3-30 chars, alphanumeric) and password (min 6 chars). Hashes passwords with `bcryptjs` salt factor 10.
- **Login**: Compares passwords using bcrypt, returning a signed JWT containing user ID and username.
- **JWT Protection**: `authMiddleware` validates `Authorization: Bearer <token>` on all private REST endpoints.
- **Hardening**: Configured with `helmet` for HTTP security headers and dynamic `cors` validating LAN private IP subnets (`192.168.x.x`, `10.x.x.x`, `172.16.x.x`, `127.0.0.1`, `localhost`).

### 2. Real-Time WebSocket Communication (`/ws`)
- **Native `ws` Engine**: Attached directly to the Express HTTP server at path `/ws`.
- **Authenticated Handshake**: Authenticates client connections via query parameter `?token=<JWT>` or initial authentication event.
- **Active Connection Manager**: Tracks active TCP sockets mapped by user ID. Supports multiple connections per user if opened in multiple tabs.
- **Multi-Type Message Delivery**: Routes text, image, and generic file messages in real-time. Automatically acknowledges message receipt and database persistence to the sender.
- **Message Interactions**: Supports sender-only edits, participant emoji reactions, and reply snapshots; edits and reactions synchronize over WebSocket.
- **Typing & Read Receipts**: Relays ephemeral typing events and persists sent, delivered, and read timestamps for WhatsApp-style message status.
- **Shared Conversation Wallpaper**: Stores the wallpaper setting per participant pair in MongoDB and its image in GridFS. Updates are synchronized to both participants and survive device changes and backend restarts.
- **Real-Time Peer Sync for Deletions**: Broadcasts `conversation:cleared` and `message:deleted` events so peer chat windows update instantaneously without refreshing.
- **Presence Broadcasts**: Automatically broadcasts `user:status` events (`online` / `offline`) to all active peers on connection and disconnection.
- **Offline Message Persistence**: Messages sent to an offline user are safely stored in MongoDB; recipient receives them upon opening the conversation.

### 3. Image & Universal File Sharing (LAN-Optimized)
- **WhatsApp-Style File Sharing**: Supports sharing files of **any file extension** (`.pdf`, `.docx`, `.xlsx`, `.zip`, `.mp3`, `.mp4`, `.apk`, code, etc.) up to **100MB** directly over the local network.
- **Image Sharing**: High-resolution image uploads (`png`, `jpg`, `gif`, `webp`, `svg`, `bmp`) up to 10MB with optional captions.
- **Automatic Disk Cleanup**: When a message or an entire conversation is deleted, associated media files stored on disk in `uploads/` are automatically deleted to prevent orphaned files.

### 4. Reliable, Paginated Message History
- **No Conversation Message Cap**: The API returns recent messages in cursor-based pages and loads older messages on demand. Pagination limits each response, not the total history; MongoDB capacity and retention determine practical storage limits.
- **Stable Ordering**: Pages use chronological ordering with message ID tie-breaking to avoid gaps or duplicates.
- **Granular Deletions**: Supports both clearing an entire conversation (`DELETE /api/messages/:userId`) and deleting individual messages (`DELETE /api/messages/item/:messageId`).
- **History Receipts**: Retrieving a page marks its pending incoming messages delivered; the client marks them read only while that conversation is visible.

### 5. Network Detection & LAN Connectivity
- **Physical Adapter Detection**: Uses `os.networkInterfaces()` in `networkUtils.js` to inspect active physical adapters (Ethernet, Wi-Fi), automatically excluding internal loopback and virtual adapters (VMware, VirtualBox, WSL).
- **Subnet Resolution**: Extracts the host IPv4 address and subnet mask (e.g. `255.255.255.0`).
- **Multi-Interface Binding**: Listens on `0.0.0.0` so requests from any LAN peer are accepted.
- **Client IP Normalization**: Strips IPv4-mapped IPv6 prefixes (`::ffff:`) for clean telemetry reporting.

---

## 🔌 API Reference

### Public Endpoints

#### `GET /api/health`
Health check endpoint reporting server uptime and database connectivity.
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-04T08:45:00.000Z",
    "server": "running",
    "database": "connected"
  }
  ```

#### `POST /api/auth/register`
Creates a new user account.
- **Request Body**:
  ```json
  {
    "username": "alice",
    "password": "securepassword123"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6701...9a",
      "username": "alice",
      "createdAt": "2026-10-04T08:45:00.000Z"
    }
  }
  ```

#### `POST /api/auth/login`
Authenticates existing user credentials.
- **Request Body**:
  ```json
  {
    "username": "alice",
    "password": "securepassword123"
  }
  ```
- **Response `200 OK`**: Returns token and user object.

---

### Protected Endpoints (`Authorization: Bearer <TOKEN>`)

#### `GET /api/auth/me`
Restores user session from token.
- **Response `200 OK`**:
  ```json
  {
    "user": {
      "id": "6701...9a",
      "username": "alice",
      "createdAt": "2026-10-04T08:45:00.000Z"
    }
  }
  ```

#### `GET /api/users`
Lists all registered users except the requesting caller.
- **Response `200 OK`**:
  ```json
  {
    "users": [
      {
        "id": "6701...bc",
        "username": "bob",
        "createdAt": "2026-10-04T08:46:00.000Z"
      }
    ]
  }
  ```

#### `GET /api/messages/:userId`
Retrieves a chronological page of messages and the shared wallpaper for the conversation.
- **Query Params**:
  - `?limit=50` (optional; defaults to 50 and is capped at 100 per response)
  - `?before=<messageId>` (optional; fetch the page preceding this message)
  - `?limit=all` (explicit full-history export; avoid for normal chat loading)
- **Response `200 OK`**:
  ```json
  {
    "messages": [
      {
        "id": "6701...ef",
        "senderId": "6701...9a",
        "receiverId": "6701...bc",
        "content": "Hello Bob! Testing LAN chat.",
        "messageType": "text",
        "deliveredAt": null,
        "readAt": null,
        "createdAt": "2026-10-04T08:47:00.000Z"
      }
    ],
    "hasMore": true,
    "nextCursor": "6701...ef",
    "wallpaper": null,
    "wallpaperUpdatedAt": null
  }
  ```

#### `PUT /api/messages/:userId/wallpaper`
Uploads and sets the shared wallpaper for the conversation. Both participants see updates in real time; the setting is restored from MongoDB on every device.
- **Request**: `multipart/form-data` with an `image` file (PNG, JPG, GIF, WebP, SVG, BMP; up to 10MB).
- **Response**: `{ "wallpaper": { "url": "/uploads/...", "fileName": "...", "updatedBy": "...", "updatedAt": "..." } }`
- **Storage**: Wallpaper image is persisted in MongoDB GridFS.

#### `DELETE /api/messages/:userId/wallpaper`
Removes the shared wallpaper for both participants.

#### `PUT /api/messages/item/:messageId`
Edits a message authored by the authenticated user. Content must contain 1–5000 characters.
- **Request**: `{ "content": "Updated message text" }`
- **Response**: Updated message, including `editedAt`.
- **Event**: Sends `message:updated` to connected participants.

#### `POST /api/messages/item/:messageId/reactions`
Toggles a supported reaction (`👍`, `❤️`, `😂`, `😮`, `😢`, or `🙏`) for the authenticated participant. Repeating the same reaction removes it.
- **Request**: `{ "emoji": "❤️" }`
- **Response**: The current reaction list.
- **Event**: Sends `message:reaction` to connected participants.

#### `POST /api/messages/upload`
Uploads an image (PNG, JPG, GIF, WebP, SVG, BMP up to 10MB) with optional caption for private LAN sharing.
- **Request**: `multipart/form-data` with fields `image` (binary file) and `caption` (optional string).
- **Response `201 Created`**:
  ```json
  {
    "message": "Image uploaded successfully",
    "imageUrl": "/uploads/image-1791915000000-123456789.png",
    "caption": "Check out this screenshot",
    "fileName": "screenshot.png",
    "fileSize": 1048576,
    "mimeType": "image/png"
  }
  ```

#### `POST /api/messages/upload-file`
Uploads a document or file of **any file extension** (`.pdf`, `.docx`, `.xlsx`, `.zip`, `.mp3`, `.mp4`, code, etc.) up to 100MB over LAN.
- **Request**: `multipart/form-data` with fields `file` (binary file) and `caption` (optional string).
- **Response `201 Created`**:
  ```json
  {
    "message": "File uploaded successfully",
    "fileUrl": "/uploads/file-1791915000000-987654321.pdf",
    "fileMeta": {
      "fileName": "Annual_Report.pdf",
      "fileSize": 2451200,
      "mimeType": "application/pdf",
      "extension": ".pdf"
    },
    "caption": "Project documentation"
  }
  ```

#### `DELETE /api/messages/:userId`
Clears entire conversation history between the caller and the specified user, cleans up all attached media files from disk, and broadcasts a real-time `conversation:cleared` WebSocket event to both peers.
- **Response `200 OK`**:
  ```json
  {
    "message": "Conversation cleared successfully",
    "deletedCount": 42
  }
  ```

#### `DELETE /api/messages/item/:messageId`
Deletes an individual message sent by or involving the caller, cleans up its uploaded file/image from disk, and broadcasts a real-time `message:deleted` WebSocket event to peers.
- **Response `200 OK`**:
  ```json
  {
    "message": "Message deleted successfully",
    "messageId": "6701...ef"
  }
  ```

#### `GET /api/network/info`
Retrieves server host telemetry and caller's IP.
- **Response `200 OK`**:
  ```json
  {
    "server": {
      "hostname": "MY-PC",
      "port": 5000,
      "protocol": "http",
      "wsProtocol": "ws"
    },
    "network": {
      "lanIp": "192.168.1.15",
      "subnet": "255.255.255.0",
      "interfaceName": "Wi-Fi",
      "activeUsers": 2
    },
    "client": {
      "ip": "192.168.1.28"
    },
    "database": {
      "status": "connected"
    }
  }
  ```

---

## 📡 WebSocket Event Contracts (`/ws`)

Connect via: `ws://<HOST_IP>:5000/ws?token=<JWT>`

### Client ➔ Server

#### 1. `message:send`
Supports text, image, and generic file messages:
```json
{
  "type": "message:send",
  "payload": {
    "receiverId": "6701...bc",
    "content": "Here is the presentation file",
    "messageType": "file",
    "replyToId": "6701...ef",
    "fileUrl": "/uploads/file-1791915000000-987654321.pdf",
    "fileMeta": {
      "fileName": "Annual_Report.pdf",
      "fileSize": 2451200,
      "mimeType": "application/pdf",
      "extension": ".pdf"
    }
  }
}
```
`replyToId` is optional and must identify a message in the same conversation. The server stores a quote snapshot with the new message.

#### 2. `users:online`
```json
{
  "type": "users:online"
}
```

#### 3. `typing:start` and `typing:stop`
Relay typing state to a conversation partner; these events are ephemeral and are not written to MongoDB.
```json
{
  "type": "typing:start",
  "payload": { "receiverId": "6701...bc" }
}
```

#### 4. `message:delivered`
Acknowledge that a message reached the recipient's active client.
```json
{
  "type": "message:delivered",
  "payload": { "messageId": "6701...ef" }
}
```

#### 5. `conversation:read`
Mark incoming messages read when the conversation is visible to the recipient.
```json
{
  "type": "conversation:read",
  "payload": {
    "otherUserId": "6701...9a",
    "lastReadMessageId": "6701...ef"
  }
}
```
`lastReadMessageId` identifies the newest incoming message visible to the reader; all earlier incoming messages in that conversation are marked read as well.

---

### Server ➔ Client

#### 1. `message:sent` (Acknowledgement to Sender)
```json
{
  "type": "message:sent",
  "payload": {
    "id": "6701...ef",
    "senderId": "6701...9a",
    "receiverId": "6701...bc",
    "content": "Here is the presentation file",
    "messageType": "file",
    "fileUrl": "/uploads/file-1791915000000-987654321.pdf",
    "fileMeta": {
      "fileName": "Annual_Report.pdf",
      "fileSize": 2451200,
      "mimeType": "application/pdf",
      "extension": ".pdf"
    },
    "status": "saved",
    "createdAt": "2026-10-04T08:47:00.000Z"
  }
}
```

#### 2. `message:received` (Delivery to Recipient)
```json
{
  "type": "message:received",
  "payload": {
    "id": "6701...ef",
    "senderId": "6701...9a",
    "receiverId": "6701...bc",
    "content": "Here is the presentation file",
    "messageType": "file",
    "fileUrl": "/uploads/file-1791915000000-987654321.pdf",
    "fileMeta": {
      "fileName": "Annual_Report.pdf",
      "fileSize": 2451200,
      "mimeType": "application/pdf",
      "extension": ".pdf"
    },
    "createdAt": "2026-10-04T08:47:00.000Z"
  }
}
```

#### 3. `conversation:cleared` (Peer Conversation Clear Event)
```json
{
  "type": "conversation:cleared",
  "payload": {
    "peerId": "6701...9a"
  }
}
```

#### 4. `message:deleted` (Peer Message Delete Event)
```json
{
  "type": "message:deleted",
  "payload": {
    "messageId": "6701...ef",
    "peerId": "6701...9a"
  }
}
```

#### 5. `message:updated` (Message Edit Event)
Contains the edited message ID, participants, new content, and `editedAt`.

#### 6. `message:reaction` (Message Reaction Event)
Contains the message ID, participants, and the complete current reaction list.

#### 7. `messages:receipt` (Delivery / Read Receipt)
Live delivery receipts contain `messageIds`; history delivery receipts use `lastDeliveredMessageId` to represent a page delivered through that message. Read receipts use `lastReadMessageId` to represent messages read through that point. All include the status, participants, and timestamp.

#### 8. `typing:start` and `typing:stop` (Typing Indicator)
Relays the typing user's ID to the recipient. The frontend clears stale typing state after a short timeout.

#### 9. `conversation:wallpaper` (Shared Wallpaper Update)
Broadcasts the updated wallpaper or `null` to both participants after a wallpaper is set, replaced, or removed.

#### 10. `user:status` (Presence Broadcast)
```json
{
  "type": "user:status",
  "payload": {
    "userId": "6701...9a",
    "status": "online"
  }
}
```

#### 11. `users:online` (Online Snapshot)
```json
{
  "type": "users:online",
  "payload": {
    "onlineUserIds": ["6701...9a", "6701...bc"]
  }
}
```

#### 12. `error`
```json
{
  "type": "error",
  "payload": {
    "message": "Recipient user does not exist or invalid format"
  }
}
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Server Listening Port (Default: 5000)
PORT=5000

# MongoDB Connection String
MONGO_URI=mongodb://127.0.0.1:27017/lanova

# JWT Secret & Lifespan
JWT_SECRET=replace_with_a_secure_random_secret_2026
JWT_EXPIRES_IN=1d

# Allowed Cross-Origin Origins (Comma-separated)
CLIENT_URL=http://localhost:5173,http://localhost:5174
```

---

## 🧪 Automated Testing

The backend includes **186 checks across 6 standalone test suites** built with Node's native assert capabilities:

```bash
cd backend

# Run all test suites sequentially (186 checks):
npm run test:all

# Or run individual suites:
npm run test           # Auth, password hashing, user listings (24 checks)
npm run test:chat      # WebSocket messaging, edits, reactions, replies, shared wallpaper & receipts (67 checks)
npm run test:network   # Interface inspection, IP detection, telemetry (29 checks)
npm run test:image     # Image uploads, lightbox support & media cleanup (25 checks)
npm run test:files     # Generic file sharing, cursor-paginated history & deletions (39 checks)
npm run test:gridfs    # GridFS persistence (2 checks)
```

> [!IMPORTANT]
> The backend server (`npm run dev`) and MongoDB must be running on `http://localhost:5000` prior to running the test suites.

---

## 🔧 Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB service is not running | Start your local MongoDB server via `mongod` or through your OS Services manager. |
| `EADDRINUSE :::5000` | Port 5000 is occupied by another process | Kill the process occupying port 5000 or change `PORT=5001` in `.env`. |
| Cross-device connections fail | OS Firewall blocking incoming TCP port 5000 | Add an inbound firewall rule on the host machine allowing TCP on port `5000` and `5173`. |
