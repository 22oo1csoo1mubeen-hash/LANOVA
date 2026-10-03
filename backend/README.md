# LANOVA Backend — Milestones 1, 2 & 3

Backend service for **LANOVA**, a LAN-based real-time chat application built for Computer Networks demonstration.

## Features Implemented

### Milestone 1: Authentication & User Management
- **Node.js & Express REST API Server**
- **MongoDB Database Persistence** with Mongoose
- **User Registration**: `POST /api/auth/register` with validation and bcrypt hashing
- **User Login**: `POST /api/auth/login` with credential verification and signed JWT issuance
- **JWT Authentication Middleware**: Protected routes requiring `Authorization: Bearer <token>`
- **Current User API**: `GET /api/auth/me` for session restoration
- **User Listing API**: `GET /api/users` retrieving registered users (excluding the caller)
- **Security & Headers**: Helmet, CORS with LAN/local origin support, express-validator

### Milestone 2: Real-Time Chat & WebSockets
- **Native WebSocket Server (`ws`)** attached to Express HTTP server at `/ws`
- **JWT-Authenticated WebSocket Handshake**: Authenticated via query token (`ws://localhost:5000/ws?token=...`) or first-message auth event
- **In-Memory Active Connection Manager**: Tracks authenticated users and active TCP sockets
- **Persistent Message Storage**: Mongoose `Message` model storing private messages in MongoDB
- **Real-Time Private Message Delivery**: Messages routed directly to the recipient's active socket
- **Offline Message Persistence**: Messages for offline users are saved in MongoDB and retrieved upon reconnection
- **Real-Time Online/Offline Status**: Broadcasts `user:status` events (`online`/`offline`) to connected clients
- **Message History API**: `GET /api/messages/:userId` retrieves conversation history sorted chronologically

### Milestone 3: Network Information & LAN Connectivity
- **Dynamic LAN IPv4 Detection**: Uses Node.js `os.networkInterfaces()` to detect active physical network adapters (Wi-Fi, Ethernet) and extract host IPv4 and subnet mask
- **Multi-Interface Server Binding**: Express and WebSocket servers listen on `0.0.0.0:5000` to accept connections across the local network
- **Network Information API**: `GET /api/network/info` returns server hostname, port, protocols, primary LAN IP, subnet mask, active peers count, and client connection IP
- **Enhanced Health Check**: `GET /api/health` reports server and database connection status
- **Cross-Device Frontend Access**: Vite development server configured with `host: 0.0.0.0` (port `5173`) and dynamic API resolution for phones/laptops on the same LAN
- **Dynamic Peer Access**: Peers on the same Wi-Fi can open `http://<LAN_IP>:5173` to register, log in, and chat in real-time

## Endpoints Summary

### REST Endpoints
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Enhanced health check (server + database status) |
| `POST` | `/api/auth/register` | Public | Register a new user (`username`, `password`) |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Private | Retrieve authenticated user profile |
| `GET` | `/api/users` | Private | List registered users (excluding caller) |
| `GET` | `/api/messages/:userId` | Private | Retrieve message history between caller and user |
| `GET` | `/api/network/info` | Private | Retrieve host LAN IP, subnet, ports, and telemetry |

### WebSocket Endpoint (`/ws`)
Connect to: `ws://<HOST_IP>:5000/ws?token=<JWT_TOKEN>`

#### Client -> Server Events
* **`message:send`**: Send private message to recipient:
  ```json
  { "type": "message:send", "payload": { "receiverId": "USER_ID", "content": "Hello!" } }
  ```
* **`users:online`**: Request list of currently online user IDs:
  ```json
  { "type": "users:online" }
  ```

#### Server -> Client Events
* **`message:sent`**: Acknowledgement that message was saved in MongoDB:
  ```json
  { "type": "message:sent", "payload": { "id": "MSG_ID", "senderId": "A", "receiverId": "B", "content": "Hello!", "status": "saved", "createdAt": "..." } }
  ```
* **`message:received`**: Real-time incoming message delivered to recipient:
  ```json
  { "type": "message:received", "payload": { "id": "MSG_ID", "senderId": "A", "receiverId": "B", "content": "Hello!", "createdAt": "..." } }
  ```
* **`user:status`**: Broadcast when a user connects or disconnects:
  ```json
  { "type": "user:status", "payload": { "userId": "USER_ID", "status": "online" } }
  ```
* **`users:online`**: Snapshot of all currently connected user IDs:
  ```json
  { "type": "users:online", "payload": { "onlineUserIds": ["USER_ID_1", "USER_ID_2"] } }
  ```
* **`error`**: Error event on malformed or rejected actions:
  ```json
  { "type": "error", "payload": { "message": "Reason..." } }
  ```

## Quick Start

### 1. Requirements
- Node.js v18+ (tested on Node v24)
- Local MongoDB running on `mongodb://127.0.0.1:27017`

### 2. Install & Start
```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

### 3. Run Automated Tests
```bash
# Run all 77 automated tests across Milestones 1, 2 & 3
npm run test:all
```
