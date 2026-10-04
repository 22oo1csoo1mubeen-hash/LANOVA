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
│   │   ├── messageController.js  # Message history fetching between users
│   │   ├── networkController.js  # Health check & LAN network telemetry
│   │   └── userController.js     # Registered user directory (excluding current user)
│   ├── middleware/
│   │   ├── authMiddleware.js     # Express JWT bearer token validation
│   │   └── errorMiddleware.js    # 404 handler and centralized error pipeline
│   ├── models/
│   │   ├── Message.js            # Mongoose schema for persistent private messages
│   │   └── User.js               # Mongoose schema for user accounts & bcrypt hashing
│   ├── routes/
│   │   ├── authRoutes.js         # Routes for /api/auth (register, login, me)
│   │   ├── messageRoutes.js      # Routes for /api/messages/:userId
│   │   ├── networkRoutes.js      # Routes for /api/network/info
│   │   └── userRoutes.js         # Routes for /api/users
│   ├── sockets/
│   │   ├── connectionManager.js  # In-memory registry of active authenticated sockets
│   │   ├── socketAuth.js         # Token extraction & verification for WebSocket handshake
│   │   ├── socketHandlers.js     # Event dispatchers (message:send, users:online, presence)
│   │   └── socketServer.js       # WebSocketServer setup, ping/pong heartbeats & lifecycle
│   ├── utils/
│   │   ├── generateToken.js      # JWT signing utility
│   │   └── networkUtils.js       # OS network interfaces inspection & LAN IP resolution
│   ├── app.js                    # Express app initialization, Helmet, CORS & middleware
│   └── server.js                 # HTTP & WebSocket server entrypoint (binds to 0.0.0.0)
├── tests/
│   ├── auth.test.js              # Automated tests for authentication & user listing
│   ├── chat.test.js              # Automated tests for WebSocket messaging & persistence
│   └── network.test.js           # Automated tests for LAN IP detection & telemetry
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
- **Message Delivery**: Routes messages to the recipient's active socket in real-time. Automatically acknowledges message receipt and database persistence to the sender.
- **Presence Broadcasts**: Automatically broadcasts `user:status` events (`online` / `offline`) to all active peers on connection and disconnection.
- **Offline Message Persistence**: Messages sent to an offline user are safely stored in MongoDB; recipient receives them upon opening the conversation.

### 3. Network Detection & LAN Connectivity
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
Retrieves chronological message history between caller and target user.
- **Response `200 OK`**:
  ```json
  {
    "messages": [
      {
        "id": "6701...ef",
        "senderId": "6701...9a",
        "receiverId": "6701...bc",
        "content": "Hello Bob! Testing LAN chat.",
        "createdAt": "2026-10-04T08:47:00.000Z"
      }
    ]
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
```json
{
  "type": "message:send",
  "payload": {
    "receiverId": "6701...bc",
    "content": "Hey there! How is the network demo going?"
  }
}
```

#### 2. `users:online`
```json
{
  "type": "users:online"
}
```

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
    "content": "Hey there! How is the network demo going?",
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
    "content": "Hey there! How is the network demo going?",
    "createdAt": "2026-10-04T08:47:00.000Z"
  }
}
```

#### 3. `user:status` (Presence Broadcast)
```json
{
  "type": "user:status",
  "payload": {
    "userId": "6701...9a",
    "status": "online"
  }
}
```

#### 4. `users:online` (Online Snapshot)
```json
{
  "type": "users:online",
  "payload": {
    "onlineUserIds": ["6701...9a", "6701...bc"]
  }
}
```

#### 5. `error`
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

The backend includes 3 standalone test scripts built with Node's native test assert capabilities.

```bash
cd backend

# Run all test suites sequentially:
npm run test:all

# Or run individual milestone suites:
npm run test           # Milestone 1: Auth, password hashing, user listings
npm run test:chat      # Milestone 2: WebSocket handshake, messaging, presence
npm run test:network   # Milestone 3: Interface inspection, IP detection, telemetry
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
