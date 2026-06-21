# How it Works

Rove operates as a dual-layer system consisting of a robust backend and a modern frontend, unified through a specialized proxy architecture.

### 1. The Backend (Node.js/Fastify)
The backend is the "brain" of the system. It runs natively on your host PC and handles:
-   **Process Management**: Spawns and manages pseudo-terminals (PTY) using `node-pty`.
-   **System Monitoring**: Uses the `systeminformation` library to poll CPU and memory metrics.
-   **Authentication**: Validates users via a secure PIN and issues JWT (JSON Web Tokens) for session management.
-   **File System Access**: Provides a restricted API for browsing directories.

### 2. The Frontend (Next.js PWA)
The frontend is a mobile-first Progressive Web App (PWA) built for speed and responsiveness. It communicates with the backend via:
-   **REST APIs**: For configuration, authentication, and stats.
-   **WebSockets**: For real-time, low-latency communication (Terminal and AI Chat).

### 3. The Unified Architecture
To simplify remote access, Rove uses a **Consolidated Proxy**:
-   The Next.js client (port 4000) is the public gateway.
-   It serves the UI directly and forwards `/api/*`, `/ws/*`, `/proxy/*`, and `/health` to the backend (port 4242) via Next.js dev-server rewrites.
-   The backend (port 4242) handles all API and WebSocket logic and can also be hit directly during development.
-   This allows you to expose the entire stack through a **single Cloudflare Tunnel URL** on port 4000.

### 4. Remote Connectivity
By running a Cloudflare Tunnel (`cloudflared`), your local port 4242 is mapped to a secure, public HTTPS URL. This allows you to access Rove from any network in the world without exposing your PC directly to the internet.
