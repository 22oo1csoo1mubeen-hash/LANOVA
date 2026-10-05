# LANOVA

## Product Requirements Document (PRD)

**Project:** LANOVA — LAN-Based Real-Time Messaging Application
**Project Type:** Computer Networks Mini Project
**Architecture:** Client–Server
**Development Approach:** Full-Stack Web Application
**Version:** 1.0
**Status:** Initial Project Specification

---

## 1. Project Overview

LANOVA is a lightweight, LAN-based, real-time messaging web application that enables users connected to the same Local Area Network (LAN) to communicate with each other.

The application is designed to demonstrate fundamental Computer Networks concepts through a practical full-stack application built using the MERN stack and WebSockets.

One computer hosts the backend server, while other devices connected to the same local network access the application through a web browser using the server's private IP address.

LANOVA focuses on simplicity, real-time communication, basic account security, and practical implementation of networking concepts.

### 1.1 Problem Statement

Traditional internet-based messaging platforms rely on external servers and internet connectivity. For a Computer Networks mini project, there is a need for a small, locally hosted application that demonstrates how devices communicate over a network.

LANOVA addresses this by providing a simple messaging environment that operates entirely within a local network without depending on external messaging services.

### 1.2 Project Objectives

* Develop a full-stack web application using the MERN stack.
* Implement real-time messaging using WebSockets over TCP.
* Demonstrate client-server architecture and LAN communication.
* Implement user authentication and persistent message storage.
* Display basic network and connection information.
* Build a simple, modern and responsive user interface.
* Provide a practical demonstration of fundamental CN concepts.

---

## 2. Target Users

LANOVA is intended for:

* Students demonstrating Computer Networks concepts.
* Users connected to the same local network.
* Small groups requiring simple local messaging.
* Faculty evaluating networking fundamentals through a working application.

---

## 3. Application Features

The application will have four main screens.

### 3.1 Registration and Login

**Purpose:** Allow users to create accounts and access the messaging application.

**Features:**

* User registration using a username and password.
* User login with existing credentials.
* Basic input validation.
* Password hashing before database storage.
* Authentication and session handling.
* Logout functionality.
* Error messages for invalid credentials or duplicate usernames.

**User flow:**

1. Open the LANOVA application.
2. Register a new account or log in.
3. Upon successful authentication, navigate to the main chat interface.

### 3.2 Users and Chat List

**Purpose:** Display registered users and provide access to conversations.

**Features:**

* Display a list of registered users.
* Show online and offline indicators.
* Select a user to open a private conversation.
* Display recent conversations.
* Show the latest message preview where available.
* Display the current user's profile name.
* Provide a logout option.

**User flow:**

1. Log in to LANOVA.
2. View the registered users and recent conversations.
3. Select a user.
4. Open the corresponding chat page.

### 3.3 Chat Page

**Purpose:** Enable real-time private messaging between LANOVA users.

**Features:**

* Send messages in real time.
* Receive messages instantly when connected.
* Display sent and received messages using distinct message bubbles.
* Show sender names and message timestamps.
* Load previous conversation history from MongoDB.
* Automatically scroll to the latest message when appropriate.
* Display basic connection status.
* Handle message delivery and connection errors.

**Messaging flow:**

1. User A opens a conversation with User B.
2. User A types and sends a message.
3. The message is transmitted through a WebSocket connection to the backend.
4. The backend validates and stores the message.
5. The backend forwards it to User B if connected.
6. User B's interface displays the received message.
7. When User B is offline, the stored message can be loaded when they next open the conversation.

**Message structure:**

* Message ID
* Sender ID
* Receiver ID
* Message content
* Timestamp

### 3.4 Network Information Panel

**Purpose:** Expose basic networking and connection details within the application.

**Features:**

* Display the server's LAN IP address.
* Display the server port.
* Show the WebSocket connection status.
* Display the number of active connected users.
* Show a simple connection indicator.
* Display the current user's connection state.

The server's LAN address and port will be configured or detected on the backend and exposed to the frontend through a suitable endpoint.

The panel is intended to provide basic connection visibility, not to function as a full network monitoring or packet analysis tool.

---

## 4. Technology Stack

LANOVA will use the MERN stack with a dedicated WebSocket communication layer.

| Layer                   | Technology                | Purpose                                               |
| ----------------------- | ------------------------- | ----------------------------------------------------- |
| Frontend                | React.js                  | Build the user interface                              |
| Styling                 | CSS or Tailwind CSS       | Responsive design and UI styling                      |
| Backend                 | Node.js                   | Server-side runtime                                   |
| API framework           | Express.js                | HTTP APIs and request handling                        |
| Real-time communication | WebSockets (`ws`)         | Bidirectional real-time messaging                     |
| Database                | MongoDB                   | Store users and messages                              |
| ODM                     | Mongoose                  | MongoDB schema and database operations                |
| Authentication          | JWT                       | Authenticate API and WebSocket requests               |
| Password security       | bcrypt                    | Secure password hashing                               |
| HTTP communication      | REST APIs                 | Registration, login, users and chat history           |
| Network protocol        | TCP                       | Reliable transport for HTTP and WebSocket connections |
| Testing                 | Postman and browser tools | API and application testing                           |
| Network analysis        | Wireshark                 | Inspect TCP, HTTP and WebSocket traffic               |

### 4.1 Why WebSockets?

Ordinary HTTP communication generally follows a request-response pattern. For real-time messaging, repeatedly polling the server is unnecessary overhead.

WebSockets provide a persistent, bidirectional communication channel. The server can push incoming messages to connected clients without waiting for another client request.

For LANOVA, the `ws` library will be used rather than a higher-level real-time framework so the WebSocket connection and message-handling flow remain visible for academic demonstration.

### 4.2 Why MongoDB?

MongoDB provides a straightforward way to store user information and conversation messages.

It supports flexible document structures and integrates naturally with Node.js through Mongoose.

The database will run locally on the host computer.

---

## 5. Computer Networks Concepts

The primary academic purpose of LANOVA is to demonstrate Computer Networks fundamentals through a functioning application.

| CN concept                 | Implementation in LANOVA                                                        |
| -------------------------- | ------------------------------------------------------------------------------- |
| Client-server architecture | The backend acts as a central server for all connected browsers.                |
| LAN                        | Multiple devices communicate through the same local network.                    |
| IP addressing              | Clients connect using the server's private IPv4 address.                        |
| Port numbers               | The server listens on a configurable port.                                      |
| TCP                        | HTTP and WebSocket communication use TCP for reliable transport.                |
| HTTP                       | Registration, login and conversation history are handled through HTTP requests. |
| WebSockets                 | Persistent, bidirectional communication enables real-time messaging.            |
| Socket connections         | The server maintains and manages active WebSocket connections.                  |
| Connection establishment   | The WebSocket handshake establishes the communication channel over TCP.         |
| Data transmission          | Messages travel from the sender to the server and then to the recipient.        |
| Connection management      | Client connections and disconnections update online status.                     |
| Protocol layering          | The application demonstrates how HTTP and WebSockets use TCP/IP networking.     |

### 5.1 Practical CN Demonstrations

During the project demonstration, the following activities can be performed:

* Connect multiple laptops to the same Wi-Fi network.
* Host the LANOVA backend on one laptop.
* Open LANOVA on other devices using the host's private IP address.
* Send messages between connected clients.
* Inspect TCP connection establishment using Wireshark.
* Observe the WebSocket handshake.
* Inspect WebSocket frames and message exchange in a controlled test.
* Disconnect a client and observe the online status update.
* Reconnect the client and retrieve previous messages.

These demonstrations will provide concrete evidence of the networking concepts used.

---

## 6. System Architecture

LANOVA follows a centralized client-server architecture.

### 6.1 Architecture Components

**Client**

* React frontend.
* HTTP requests for authentication and data retrieval.
* WebSocket connection for real-time messaging.
* Local UI state for the active conversation and connection status.

**Server**

* Node.js and Express.
* HTTP API routes.
* WebSocket connection handler.
* Authentication middleware.
* Message routing logic.
* Active user and socket connection registry.

**Database**

* MongoDB.
* User collection.
* Message collection.
* Conversation history retrieval.

### 6.2 Communication Flow

**Authentication flow**

1. The browser sends a login or registration request over HTTP.
2. The Express backend validates the request.
3. The backend verifies credentials or creates the account.
4. A JWT is returned upon successful authentication.
5. The frontend uses the token for authenticated requests and WebSocket connection authentication.

**Messaging flow**

1. The browser establishes a WebSocket connection with the backend.
2. The server authenticates the connection.
3. The client sends a message event.
4. The server validates the sender and recipient.
5. The message is saved to MongoDB.
6. The server forwards the message to the recipient's active connection.
7. The recipient's browser updates the chat interface.

If the recipient is offline, the message remains in the database and is retrieved through the chat history API.

---

## 7. Database Design

The initial version will use two main collections.

### 7.1 Users Collection

| Field          | Type     | Description                |
| -------------- | -------- | -------------------------- |
| `_id`          | ObjectId | Unique user identifier     |
| `username`     | String   | Unique username            |
| `passwordHash` | String   | Hashed password            |
| `createdAt`    | Date     | Account creation timestamp |

Online status will be maintained by the server's active connection registry rather than relying on a potentially stale database field.

### 7.2 Messages Collection

| Field        | Type     | Description               |
| ------------ | -------- | ------------------------- |
| `_id`        | ObjectId | Unique message identifier |
| `senderId`   | ObjectId | Sender's user ID          |
| `receiverId` | ObjectId | Recipient's user ID       |
| `content`    | String   | Message text              |
| `createdAt`  | Date     | Message timestamp         |

Indexes should be added for retrieving conversation messages efficiently.

The initial application will not require a separate conversation collection because private conversations can be identified using sender and receiver IDs.

---

## 8. API and WebSocket Design

### 8.1 HTTP API Endpoints

| Method | Endpoint                | Purpose                             |
| ------ | ----------------------- | ----------------------------------- |
| POST   | `/api/auth/register`    | Register a new user                 |
| POST   | `/api/auth/login`       | Authenticate an existing user       |
| GET    | `/api/users`            | Retrieve registered users           |
| GET    | `/api/messages/:userId` | Retrieve conversation history       |
| GET    | `/api/network/info`     | Retrieve server network information |

All protected endpoints will require authentication.

### 8.2 WebSocket Events

| Event          | Direction        | Purpose                               |
| -------------- | ---------------- | ------------------------------------- |
| `connection`   | Client → Server  | Establish a WebSocket connection      |
| `message`      | Client → Server  | Send a private message                |
| `message`      | Server → Client  | Deliver an incoming message           |
| `user_online`  | Server → Clients | Notify clients that a user is online  |
| `user_offline` | Server → Clients | Notify clients that a user is offline |
| `error`        | Server → Client  | Report invalid or failed operations   |

The implementation will use a simple JSON message format with an event name and associated payload.

The WebSocket protocol's built-in ping/pong mechanism can be used for connection health checks if needed.

---

## 9. User Interface and Design Requirements

LANOVA should have a minimal, modern and consistent interface.

### Design principles

* Simple and intuitive navigation.
* Responsive layouts for desktop and mobile browsers.
* Clean message bubbles and readable typography.
* Distinct online and offline indicators.
* Consistent colors and spacing.
* Minimal animations.
* Clear feedback for loading, errors and connection states.

### Main Layout

**Login and Registration**

* Centered authentication card.
* Username and password fields.
* Submit button.
* Link to switch between login and registration.

**Users and Chat List**

* Sidebar containing registered users and recent conversations.
* Online indicators.
* Selected conversation highlighting.
* Current user information and logout.

**Chat Page**

* Conversation header.
* Scrollable message history.
* Distinct sent and received message styles.
* Message input and send button.
* Connection status.

**Network Information**

* Server IP address.
* Port number.
* WebSocket status.
* Active user count.

The design should prioritize functionality and clarity rather than introducing unnecessary UI complexity.

---

## 10. Non-Functional Requirements

### Performance

* Messages should appear with minimal delay under normal LAN conditions.
* The application should support a small number of simultaneous clients.
* Conversation history should load efficiently.

### Reliability

* The application should handle temporary client disconnections.
* Messages should be stored before being reported as successfully accepted by the server.
* Failed message operations should provide suitable feedback.

### Security

* Passwords must never be stored in plain text.
* Authenticated access must be enforced for protected APIs and WebSocket connections.
* Message payloads and user input must be validated.
* Database access must be restricted to the backend.
* The initial version will use application-level authentication and password security. Network encryption using TLS is an optional extension, not an assumed feature of the initial build.

### Usability

* Users should be able to register, log in and start a conversation without complicated configuration.
* The frontend should display clear online, offline and disconnected states.
* The application should work in modern browsers.

### Deployment

* The backend must be accessible to devices on the same LAN.
* The server should bind to an appropriate network interface rather than only `localhost`.
* The frontend production build should be served by the backend or configured to use the correct LAN server address.
* MongoDB should be available locally on the host machine.

---

## 11. Scope

### In Scope

* User registration and login.
* Private one-to-one messaging.
* Real-time message delivery.
* Online/offline status.
* Persistent chat history.
* Network information panel.
* LAN-based deployment.
* TCP and WebSocket communication.
* Basic connection error handling.
* CN concept demonstration using Wireshark.

### Out of Scope

To keep the project small and manageable, the following features will not be implemented in the initial version:

* Group chats.
* Voice and video calling.
* File sharing.
* Message reactions and advanced formatting.
* End-to-end encryption.
* Complex admin dashboards.
* AI or ML features.
* Cloud hosting.
* Internet-based communication across different networks.
* Advanced network traffic analytics.
* Complex message delivery guarantees and offline push notifications.

---

## 12. Testing and Validation

The application will be validated through functional and networking tests.

| Test case                                     | Expected result                                 |
| --------------------------------------------- | ----------------------------------------------- |
| Register a new account                        | Account is created and stored in MongoDB        |
| Register with an existing username            | Duplicate registration is rejected              |
| Log in with valid credentials                 | User is authenticated                           |
| Log in with invalid credentials               | Appropriate error is displayed                  |
| Open the application on another LAN device    | Client connects to the server                   |
| Send a private message                        | Recipient receives the message in real time     |
| Send a message while the recipient is offline | Message is stored and available later           |
| Refresh the browser                           | User can reload previous conversation history   |
| Disconnect a client                           | Online status updates                           |
| Reconnect a client                            | WebSocket connection is re-established          |
| Inspect traffic using Wireshark               | TCP and WebSocket communication can be observed |
| Enter an incorrect server address             | Connection failure is handled clearly           |

The initial test environment will consist of two or three devices connected to the same local network.

---

## 13. Development Plan

The implementation will follow a small, incremental development process.

### Phase 1: Project Setup

* Initialize the React frontend.
* Set up the Node.js and Express backend.
* Configure MongoDB and Mongoose.
* Establish the project folder structure.

### Phase 2: Authentication

* Implement registration and login APIs.
* Add password hashing.
* Implement JWT authentication.
* Create the login and registration screens.

### Phase 3: User List and Database

* Implement the users API.
* Create the user list interface.
* Design the message schema.
* Implement conversation history retrieval.

### Phase 4: WebSocket Communication

* Set up the WebSocket server using `ws`.
* Implement authenticated client connections.
* Create the message routing mechanism.
* Save and retrieve messages through MongoDB.
* Implement online/offline status updates.

### Phase 5: Frontend Chat

* Create the chat interface.
* Integrate WebSocket communication.
* Display incoming and outgoing messages.
* Load previous messages.
* Add connection status indicators.

### Phase 6: Network Information and Testing

* Implement the network information API.
* Display the server's IP address and port.
* Test the application across multiple LAN devices.
* Inspect the network traffic using Wireshark.
* Fix connection and message handling issues.

### Phase 7: Final Validation

* Perform end-to-end tests.
* Prepare the project demonstration.
* Document the CN concepts.
* Prepare screenshots and a short explanation of the architecture.

---

## 14. Project Success Criteria

LANOVA will be considered complete when:

* Users can register and log in successfully.
* The application works across multiple devices on the same LAN.
* Users can exchange private messages in real time.
* Messages are persisted in MongoDB.
* Online and offline statuses are displayed correctly.
* The network information panel displays the server's connection details.
* The application handles common connection failures.
* TCP and WebSocket communication can be demonstrated and explained.
* The project runs without requiring an external cloud service or internet connection, apart from any initial setup dependencies.

---

## 15. Final Project Summary

**LANOVA — LAN-Based Real-Time Messaging Application**

LANOVA is a compact full-stack web application developed to demonstrate core Computer Networks concepts through real-time communication over a local area network.

It combines a React frontend, a Node.js and Express backend, MongoDB for persistent storage, and WebSockets for real-time communication.

The application focuses on four primary screens:

1. Registration and Login
2. Users and Chat List
3. Chat Page
4. Network Information

Its primary academic value lies in demonstrating client-server architecture, IP addressing, port numbers, TCP, HTTP, WebSockets, socket connections and connection management through a practical, working application.

**The central principle of LANOVA is simplicity: a small, usable messaging application that clearly demonstrates how network communication works.**
