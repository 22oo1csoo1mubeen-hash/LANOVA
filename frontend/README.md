# LANOVA Frontend 💻

> **Modern, Glassmorphic Web Client for LANOVA Real-Time LAN Chat.**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React Router](https://img.shields.io/badge/React_Router-v7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)](https://reactrouter.com/)
[![Lucide Icons](https://img.shields.io/badge/Icons-Lucide%20React-F56565?style=flat-square)](https://lucide.dev/)
[![Oxlint](https://img.shields.io/badge/Linter-Oxlint-4B32C3?style=flat-square)](https://oxc.rs/)

---

## 🌟 Overview

The **LANOVA Frontend** is a responsive single-page web application (SPA) built using **React 19** and **Vite 8**. It delivers a dark-mode, glassmorphic user interface designed for seamless real-time messaging across local area networks.

It features zero third-party cloud requirements, dynamic host IP detection, automatic WebSocket connection management, responsive mobile support, and an interactive network diagnostics dashboard.

---

## 🚀 Key Features

- **⚡ Blazing Fast HMR**: Powered by Vite 8 with ES modules and near-instant Hot Module Replacement.
- **💬 Real-Time Messaging**: Built on native WebSockets with full duplex bidirectional updates and optimistic message delivery.
- **🟢 Live User Presence**: Real-time indicators showing online and offline states for all registered network peers.
- **🔍 Dynamic LAN API Resolution**: Automatically resolves the backend server address (`http://<LAN_IP>:5000`) based on the client browser's current hostname—no manual IP reconfiguration needed when accessing from other phones or laptops on Wi-Fi!
- **🌐 Network Monitor Dashboard**: Interactive telemetry page displaying host LAN IPv4 address, listening port, subnet mask, active peer counts, connection status badges, and 1-click shareable links.
- **😀 Emoji Picker & Rich Interactions**: Built-in categorized emoji picker, user profile inspect modals, and conversation reset confirmation modals.
- **🎨 Glassmorphic Dark UI**: Custom CSS design system with curated typography (Inter, Outfit, Space Grotesk), smooth micro-animations, and responsive layout.
- **📱 Fully Mobile Responsive**: Seamlessly adapts between desktop split-view chat and mobile drawer view with dedicated back navigation.

---

## 📁 Project Structure

```
frontend/
├── public/                     # Static assets
│   └── favicon.svg             # Vector brand icon
├── src/
│   ├── assets/                 # Brand graphics and media
│   ├── components/             # Reusable modular UI components
│   │   ├── AppHeader.jsx       # Global application header with presence & actions
│   │   ├── AppLayout.jsx       # Layout shell wrapping header and content views
│   │   ├── AuthInput.jsx       # Input field with floating labels and validation
│   │   ├── Avatar.jsx          # Geometric user avatar with online pulse dot
│   │   ├── ChatArea.jsx        # Conversation window with header, message feed & input
│   │   ├── ChatUserList.jsx    # Peer directory with search and active highlights
│   │   ├── ConfirmModal.jsx    # Accessible modal dialog for user confirmation
│   │   ├── EmojiPicker.jsx     # Interactive categorized emoji selector
│   │   ├── LanovaLogo.jsx      # SVG vector brand wordmark
│   │   ├── Logo.jsx            # Compact header logo component
│   │   ├── NetworkCard.jsx     # Glassmorphic telemetry metric card
│   │   ├── NetworkWidget.jsx   # Compact network status widget
│   │   ├── ProtectedRoute.jsx  # Auth guard route preventing unauthenticated access
│   │   ├── Sidebar.jsx         # Supplemental navigation sidebar
│   │   └── UserInfoModal.jsx   # Modal presenting peer profile information
│   ├── context/                # React Context Providers
│   │   ├── AuthContext.jsx     # User state, JWT token management & session restoration
│   │   └── SocketContext.jsx   # WebSocket connection, event listeners & presence
│   ├── pages/                  # Page routes
│   │   ├── LandingPage.jsx     # Modern hero landing page
│   │   ├── AuthPage.jsx        # Login & registration forms with animated transitions
│   │   ├── ChatPage.jsx        # Real-time chat workspace
│   │   └── NetworkPage.jsx     # Live computer networks telemetry dashboard
│   ├── styles/                 # Custom CSS design system
│   │   ├── animations.css      # Fade, slide, and keyframe transitions
│   │   ├── auth.css            # Styles for login and registration forms
│   │   ├── chat.css            # Comprehensive chat UI, messages & bubble styling
│   │   ├── global.css          # Reset, base styles & typography imports
│   │   ├── landing.css         # Hero landing styles
│   │   ├── network.css         # Telemetry dashboard & cards layout
│   │   └── tokens.css          # CSS custom properties (colors, radii, shadows)
│   ├── utils/                  # Utility functions
│   │   ├── api.js              # Centralized HTTP client with dynamic host resolution
│   │   └── clipboard.js        # Clipboard helper with fallback support
│   ├── App.jsx                 # Client-side router configuration
│   └── main.jsx                # React application entry point
├── index.html                  # HTML entry point with Google Fonts
├── vite.config.js              # Vite configuration (0.0.0.0 binding)
├── package.json                # Project dependencies and npm scripts
└── README.md                   # This frontend documentation file
```

---

## 🚦 Available Scripts

Navigate to the `frontend/` directory before running any command:

```bash
cd frontend
```

### `npm run dev`
Starts the Vite local development server with Hot Module Replacement (HMR).
Configured to listen on `0.0.0.0:5173`, allowing any device on your local Wi-Fi/LAN to access the frontend via `http://<YOUR_LAN_IP>:5173`.

### `npm run build`
Compiles and bundles the application for production using Vite into the `dist/` directory.

### `npm run preview`
Locally previews the production build output from the `dist/` folder.

### `npm run lint`
Runs [Oxlint](https://oxc.rs/) across all JavaScript and JSX source files for fast static analysis.

---

## ⚙️ Environment Configuration

By default, LANOVA requires **zero configuration** for local network use!
The centralized API client in [`src/utils/api.js`](src/utils/api.js) automatically resolves the backend URL dynamically:
- When visited at `http://localhost:5173`, it requests `http://localhost:5000`.
- When visited at `http://192.168.1.25:5173`, it requests `http://192.168.1.25:5000`.

If you wish to explicitly override the backend address, create a `.env` file in the `frontend/` root:

```env
VITE_API_URL=http://192.168.1.100:5000
```

---

## 🧭 Application Routes

| Path | Component | Guard | Description |
| :--- | :--- | :---: | :--- |
| `/` | `LandingPage` | Public | Hero landing page introducing LANOVA |
| `/login` | `AuthPage` | Public | User authentication tab |
| `/register` | `AuthPage` | Public | New account registration tab |
| `/chat` | `ChatPage` | Protected | Main real-time messaging workspace |
| `/network` | `NetworkPage` | Protected | Host network information & peer metrics |

---

## 🔌 State Management Architecture

```
                    ┌────────────────────────────┐
                    │      BrowserRouter         │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │       AuthProvider         │
                    │  (Token & User Session)    │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │      SocketProvider        │
                    │ (WebSocket & Presence Set) │
                    └─────────────┬──────────────┘
                                  │
                     ┌────────────┴────────────┐
                     ▼                         ▼
            ┌─────────────────┐       ┌─────────────────┐
            │    ChatPage     │       │   NetworkPage   │
            │  (Messaging)    │       │  (Diagnostics)  │
            └─────────────────┘       └─────────────────┘
```

1. **`AuthContext`** ([`src/context/AuthContext.jsx`](src/context/AuthContext.jsx)):
   - Stores user authentication state and JWT token in `sessionStorage` (`lanova_token`, `lanova_user`).
   - Automatically validates and restores sessions upon page reload via `GET /api/auth/me`.
   - Exposes `login()`, `register()`, and `logout()` helpers.

2. **`SocketContext`** ([`src/context/SocketContext.jsx`](src/context/SocketContext.jsx)):
   - Instantiates native WebSocket connection to `ws://<HOST>:5000/ws?token=<JWT>` when authenticated.
   - Maintains a set of currently online user IDs (`onlineUserIds`).
   - Handles automatic reconnection with exponential backoff if the socket is unexpectedly severed.
   - Exposes `sendMessage(receiverId, content)`, `isUserOnline(userId)`, and `addMessageListener(fn)`.

---

## 🎨 Design System & Styling

LANOVA avoids utility-class bloat by employing a modular Vanilla CSS architecture:
- **Design Tokens** ([`src/styles/tokens.css`](src/styles/tokens.css)): Consistent variables for primary greens, dark backgrounds, glass borders, elevations, and typography.
- **Glassmorphism**: Backdrop blur filters (`backdrop-filter: blur(16px)`), subtle translucent borders, and ambient glow effects.
- **Micro-Animations** ([`src/styles/animations.css`](src/styles/animations.css)): Smooth button hover states, optimistic message entry animations, pulsing presence status dots, and modal transitions.

---

## 💡 Multi-Device Testing Tips

1. Ensure the host computer and test devices (e.g. your smartphone) are on the **exact same Wi-Fi network**.
2. Find the host IP on the `/network` page or in the backend console.
3. Open mobile Safari / Chrome and visit `http://<HOST_IP>:5173`.
4. Test real-time messaging between your computer and mobile phone.
