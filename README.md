# LANOVA

LANOVA is a real-time, one-to-one chat application built with React, Express, MongoDB, and WebSockets. It runs locally on a LAN or as a hosted frontend/backend deployment.

## Features

- Real-time text, image, and file messaging, including offline message storage
- Cursor-paginated conversation history with no fixed total message-count cap
- Typing indicators and persisted sent, delivered, and read receipts
- Clickable links, emoji reactions, sender-only editing, and replies
- Shared conversation wallpaper: either participant can set or remove it; both see the same image across devices
- Responsive desktop and mobile chat interface
- Online presence and network diagnostics

History is loaded in pages of 50 messages (up to 100 per API request), with older messages loaded as you scroll. This avoids downloading the entire conversation on every open. Total history is limited by the configured database's storage and retention, not by an application message-count cutoff.

Wallpaper metadata is stored per conversation in MongoDB, and its image is stored in GridFS. A wallpaper change is synchronized to both participants in real time.

## Architecture

| Component | Technology | Purpose |
| --- | --- | --- |
| Frontend | React, Vite | Chat and network dashboard |
| Backend | Node.js, Express, `ws` | REST API, authenticated WebSocket messaging |
| Database | MongoDB, Mongoose | Accounts, messages, receipts, and shared chat settings |
| Media storage | MongoDB GridFS | Persistent uploaded files and wallpapers |

For hosted deployments, the frontend can run on Vercel, the backend on Render, and MongoDB on a reachable MongoDB service. The same application can also run locally for LAN use.

## Run locally

Requirements: Node.js 18+, npm, and a running MongoDB instance.

1. Clone the repository:

   ```sh
   git clone https://github.com/22oo1csoo1mubeen-hash/LANOVA.git
   cd LANOVA
   ```

2. Configure and start the backend:

   ```sh
   cd backend
   npm install
   ```

   Copy `.env.example` to `.env`. Set `MONGO_URI` to your MongoDB connection string and replace `JWT_SECRET` with a long, random secret. Then start the server:

   ```sh
   npm start
   ```

   The API and WebSocket endpoint are available at `http://localhost:5000` and `ws://localhost:5000/ws`.

3. In a second terminal, start the frontend:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`.

To access a local instance from another device on the same LAN, use the host machine's LAN IP and allow inbound traffic to the frontend and backend ports in its firewall.

## Deployment configuration

Configure environment variables in the hosting providers; do not commit secrets.

**Backend (Render or another Node host):**

- `MONGO_URI`: reachable MongoDB connection string
- `JWT_SECRET`: long, random secret
- `JWT_EXPIRES_IN`: token lifetime (for example, `1d`)
- `CLIENT_URL`: frontend origin, such as `https://your-app.vercel.app`
- `PORT`: use the port provided by the host, if applicable

**Frontend (Vercel):**

- `VITE_API_URL`: deployed backend origin, for example `https://your-api.onrender.com`

The browser uses HTTPS/WSS for HTTPS deployments. Ensure the backend host and MongoDB service are available to each other.

## API overview

Authenticated REST routes use `Authorization: Bearer <token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Backend/database health |
| `POST` | `/api/auth/register` | Register |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/users` | List other users |
| `GET` | `/api/messages/:userId?limit=50` | Fetch recent history and shared wallpaper |
| `GET` | `/api/messages/:userId?limit=50&before=<messageId>` | Fetch an older history page |
| `GET` | `/api/messages/:userId?limit=all` | Fetch full history for export |
| `PUT` | `/api/messages/:userId/wallpaper` | Upload/set shared wallpaper (`multipart/form-data`, `image` field) |
| `DELETE` | `/api/messages/:userId/wallpaper` | Remove shared wallpaper for both participants |
| `PUT` | `/api/messages/item/:messageId` | Edit an authored message |
| `POST` | `/api/messages/item/:messageId/reactions` | Toggle a reaction |

WebSocket events at `/ws` provide real-time messages, typing state, delivery/read receipts, presence, and wallpaper updates. See the [backend API and event documentation](./backend/README.md) for request and payload details.

## Tests and checks

The backend integration tests require MongoDB and a backend server listening on `localhost:5000`.

```sh
cd backend
npm run test:all
```

Frontend checks:

```sh
cd frontend
npm run lint
npm run build
```

## Project layout

```text
backend/    Express API, WebSocket server, MongoDB models, and tests
frontend/   React/Vite application
README.md   Project overview and setup
```
