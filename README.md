# LANOVA 🌐

> **Private. Local. Instant. Real-Time LAN-Based Messaging System.**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Native%20ws-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://github.com/websockets/ws)
[![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)

---

## 📖 Overview

**LANOVA** is a high-performance, real-time local area network (LAN) messaging application designed for fast, reliable, and secure communication without relying on external internet connectivity or third-party cloud infrastructure.

Built for computer networks demonstrations, office environments, campus dorms, and air-gapped secure labs, LANOVA automatically detects the host computer's active LAN network interface (Wi-Fi or Ethernet), binds across all interfaces (`0.0.0.0`), and serves an instant messaging and network diagnostic interface to any peer connected to the same local subnet.

```
                     ┌───────────────────────────────────────────────┐
                     │              Local Wi-Fi / LAN                │
                     │                 192.168.x.x                   │
                     └───────┬───────────────────────────────┬───────┘
                             │                               │
             ┌───────────────▼───────────────┐               │
             │       HOST MACHINE (PC)       │               │
             │  ┌─────────────────────────┐  │               │
             │  │   Vite React Frontend   │  │               │
             │  │      Port 5173 (HMR)    │  │               │
             │  └────────────┬────────────┘  │               │
             │               │ HTTP / WS     │               │
             │  ┌────────────▼────────────┐  │               │
             │  │   Express + ws Server   │  │               │
             │  │        Port 5000        │  │               │
             │  └────────────┬────────────┘  │               │
             │               │ Mongoose      │               │
             │  ┌────────────▼────────────┐  │               │
             │  │      MongoDB Server     │  │               │
             │  │        Port 27017       │  │               │
             │  └─────────────────────────┘  │               │
             └───────────────────────────────┘               │
                             │                               │
             ┌───────────────▼───────────────────────────────▼───────┐
             │                  LAN PEER DEVICES                     │
             │     Smartphones, Laptops, Tablets on same Wi-Fi       │
             │            http://<HOST_LAN_IP>:5173                  │
             └───────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

- **🚀 Real-Time Full-Duplex Chat**: Instant bidirectional messaging powered by native WebSockets (`ws`) with optimistic client UI updates.
- **📶 Zero Cloud / 100% LAN First**: Functions completely offline inside your local subnet—no external SaaS, tracking, or cloud dependencies.
- **🔍 Dynamic LAN IP & Subnet Discovery**: Automatically inspects network adapters using Node.js `os.networkInterfaces()`, identifies active physical IPv4 adapters, and displays server telemetry.
- **📊 Real-Time Network Monitor Dashboard**: Dedicated dashboard displaying host IP, listening port, subnet mask, live peer count, connection state, and a one-click shareable LAN link.
- **🔐 Secure Authentication**: User registration and login with `bcryptjs` password hashing and signed JSON Web Tokens (`jsonwebtoken`).
- **💾 Message Persistence & History**: MongoDB storage via Mongoose schemas ensures messages are preserved, with full historical conversation retrieval.
- **📬 Offline Messaging Support**: Send messages to offline users; messages are securely stored in MongoDB and retrieved immediately when they log in.
- **🟢 Live User Presence**: Real-time `online`/`offline` status broadcasts via WebSocket events.
- **🎨 Glassmorphic Dark UI**: Premium design built with modern CSS variables, subtle micro-animations, responsive layout, user profile modals, and integrated emoji picker.
- **📱 Cross-Platform Multi-Device**: Fully responsive on desktops, laptops, tablets, and mobile devices (iOS / Android).

---

## 🏗️ Repository Architecture

This repository is organized as a clean decoupled monorepo:

```
LANOVA/
├── backend/                  # Node.js + Express + WebSocket backend service
│   ├── src/
│   │   ├── config/           # Database configuration (MongoDB connection)
│   │   ├── controllers/      # Route controllers (auth, user, message, network)
│   │   ├── middleware/       # JWT auth verification, error handlers
│   │   ├── models/           # Mongoose data models (User, Message)
│   │   ├── routes/           # Express REST endpoints
│   │   ├── sockets/          # WebSocket server, connection manager & event handlers
│   │   ├── utils/            # LAN IP discovery, token generation
│   │   ├── app.js            # Express app configuration & middleware pipeline
│   │   └── server.js         # HTTP + WebSocket server initialization & lifecycle
│   ├── tests/                # Automated test suites (auth, chat, network)
│   ├── .env.example          # Environment variables template
│   ├── package.json          # Backend dependencies and test scripts
│   └── README.md             # Backend detailed documentation
│
├── frontend/                 # React 19 + Vite client application
│   ├── public/               # Public static assets & favicon
│   ├── src/
│   │   ├── components/       # Reusable UI components (ChatArea, Header, Modals, etc.)
│   │   ├── context/          # React contexts (AuthContext, SocketContext)
│   │   ├── pages/            # View pages (Landing, Auth, Chat, Network)
│   │   ├── styles/           # CSS design system, themes, and animations
│   │   ├── utils/            # Dynamic API URL resolver, clipboard helper
│   │   ├── App.jsx           # Client-side routing and protected routes
│   │   └── main.jsx          # React DOM entrypoint
│   ├── index.html            # HTML shell with Google fonts & metadata
│   ├── vite.config.js        # Vite config (0.0.0.0 host binding, strict port)
│   ├── package.json          # Frontend dependencies and build scripts
│   └── README.md             # Frontend detailed documentation
│
├── instructions/             # Project guidelines and architectural specifications
└── README.md                 # Root repository guide (this file)
```

---

## 🛠️ Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Backend Runtime** | [Node.js](https://nodejs.org/) (v18+) | JavaScript runtime with ES Modules (`type: "module"`) |
| **REST Framework** | [Express 4](https://expressjs.com/) | RESTful API server with Helmet & CORS |
| **WebSocket Engine** | [ws](https://github.com/websockets/ws) | Native RFC 6455 compliant WebSocket server |
| **Database** | [MongoDB](https://www.mongodb.com/) + [Mongoose 8](https://mongoosejs.com/) | Document database with schematized data models |
| **Security & Auth** | [JWT](https://jwt.io/) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Stateless bearer token authentication & password hashing |
| **Frontend Framework** | [React 19](https://react.dev/) | Component-based reactive UI |
| **Build Tool** | [Vite 8](https://vitejs.dev/) | Next-generation frontend tooling with lightning-fast HMR |
| **Routing** | [React Router 7](https://reactrouter.com/) | Client-side routing and navigation guards |
| **Icons & Design** | [Lucide React](https://lucide.dev/) + Vanilla CSS | Clean vector icons and custom CSS design system |
| **Linting & Code Quality**| [Oxlint](https://oxc.rs/) | High-performance linter for modern JavaScript/React |

---

## 🚀 Quick Start Guide

### 1. Prerequisites

Before running the application, make sure you have installed:

- **[Node.js](https://nodejs.org/)** (v18.x or higher, tested up to v24)
- **[MongoDB Community Server](https://www.mongodb.com/try/download/community)** running locally on port `27017` (or MongoDB running via Docker)
- **Git**

Verify your environment:
```bash
node -v       # Should be v18+
npm -v        # Should be v9+
mongod --version # Or verify your local MongoDB service is running
```

---

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/LANOVA.git
cd LANOVA
```

---

### 3. Backend Setup

1. Open a terminal and navigate into the `backend/` folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the environment configuration file:
   ```bash
   cp .env.example .env
   ```

4. Verify your `.env` settings:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/lanova
   JWT_SECRET=lanova_super_secret_jwt_key_2026
   JWT_EXPIRES_IN=1d
   CLIENT_URL=http://localhost:5173,http://localhost:5174
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```

   You should see:
   ```
   [LANOVA Database] MongoDB Connected: 127.0.0.1:27017/lanova
   ==================================================
   [LANOVA Server] Backend listening on port 5000 (0.0.0.0)
   [LANOVA Server] Local HTTP:  http://localhost:5000/api/health
   [LANOVA Server] LAN HTTP:    http://192.168.x.x:5000/api/health
   [LANOVA Server] Local WS:    ws://localhost:5000/ws
   [LANOVA Server] LAN WS:      ws://192.168.x.x:5000/ws
   ==================================================
   ```

---

### 4. Frontend Setup

1. Open a **second terminal** and navigate into the `frontend/` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

   Vite will output:
   ```
     VITE v8.3.x  ready in 250 ms

     ➜  Local:   http://localhost:5173/
     ➜  Network: http://192.168.x.x:5173/
   ```

4. Open your browser and navigate to **`http://localhost:5173`**.

---

## 📱 Multi-Device LAN Access (Cross-Device Chatting)

To chat between different computers or smartphones connected to the same Wi-Fi:

1. **Verify both devices are on the same Wi-Fi/LAN.**
2. On the **host PC** running LANOVA, locate the LAN IP address shown in the backend console or on the frontend **Network Monitor** page (`/network`), for example:
   ```
   http://192.168.1.15:5173
   ```
3. On a **second laptop, tablet, or smartphone**, open a web browser and visit:
   ```
   http://192.168.1.15:5173
   ```
4. Register a new user account (e.g. `peer_device`).
5. You can now chat in real-time between devices over the local network!

> [!TIP]
> **Windows Defender Firewall Notice:** If your peer device cannot reach the host IP, ensure your host operating system allows incoming traffic on ports `5000` (Node.js API/WebSocket) and `5173` (Vite dev server) under Windows Firewall or macOS Security settings.

---

## 🔌 API & WebSocket Reference

### REST Endpoints

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | No | Server & MongoDB health check |
| `POST` | `/api/auth/register` | No | Register new user account (`username`, `password`) |
| `POST` | `/api/auth/login` | No | Authenticate user & receive signed JWT |
| `GET` | `/api/auth/me` | Yes (`Bearer`) | Retrieve current user profile |
| `GET` | `/api/users` | Yes (`Bearer`) | List all registered users (excluding caller) |
| `GET` | `/api/messages/:userId` | Yes (`Bearer`) | Get conversation history with specific user |
| `GET` | `/api/network/info` | Yes (`Bearer`) | Retrieve host LAN IP, subnet, ports, and telemetry |

### WebSocket Endpoint (`/ws`)

Connect at: `ws://<HOST_IP>:5000/ws?token=<JWT_TOKEN>`

| Direction | Event Name | Payload Structure | Description |
| :--- | :--- | :--- | :--- |
| **Client ➔ Server** | `message:send` | `{ receiverId, content }` | Send a private message |
| **Client ➔ Server** | `users:online` | `{}` | Request list of currently online user IDs |
| **Server ➔ Client** | `message:sent` | `{ id, senderId, receiverId, content, createdAt }` | Confirmation that message was stored in MongoDB |
| **Server ➔ Client** | `message:received`| `{ id, senderId, receiverId, content, createdAt }` | Real-time incoming message delivered to recipient |
| **Server ➔ Client** | `user:status` | `{ userId, status: "online" \| "offline" }` | Presence change broadcast |
| **Server ➔ Client** | `users:online` | `{ onlineUserIds: [...] }` | Initial list of active user IDs upon connect |
| **Server ➔ Client** | `error` | `{ message: "..." }` | Error notifications (auth failures, malformed payloads) |

---

## 🧪 Testing & Verification

The backend includes a comprehensive automated test suite covering all modules:

```bash
cd backend

# Run the complete test suite (Auth, Chat & WebSocket, Network Telemetry)
npm run test:all

# Run individual suites
npm run test           # Authentication & User Management (Milestone 1)
npm run test:chat      # Real-time WebSocket Messaging & Persistence (Milestone 2)
npm run test:network   # LAN IP Detection & Telemetry (Milestone 3)
```

> [!NOTE]
> Make sure the backend server (`npm run dev`) and MongoDB are running before executing the test scripts.

To lint and check code health in the frontend:
```bash
cd frontend
npm run lint
npm run build
```

---

## 🛡️ Security Architecture

- **Stateless Authentication**: Uses cryptographic JSON Web Tokens (`HS256`) with configurable expiration.
- **Salted Password Hashing**: Passwords hashed with `bcryptjs` (salt factor 10) before storage; plaintext passwords are never stored.
- **Input Validation**: Sanitized using `express-validator` on all authentication endpoints.
- **HTTP Hardening**: Configured with `helmet` for secure HTTP headers.
- **Controlled CORS**: Dynamically allows `localhost`, `127.0.0.1`, and private RFC 1918 LAN subnets (`192.168.x.x`, `10.x.x.x`, `172.16.x.x - 172.31.x.x`).
- **Protected WebSocket Upgrades**: Native token validation on WebSocket upgrade prevents unauthorized socket hijacking.

---

## 👥 Authors & Acknowledgments

- **Syed Mubeen** — Lead Developer & Architecture
- Developed for Computer Networks demonstration & secure local communications.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
