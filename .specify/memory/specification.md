# Rove Master Specification

## 1. Project Mission
Rove is a self-hosted, open-source remote developer command center. It allows developers to control their (primarily Arch Linux) PC from a mobile PWA via a secure Cloudflare Tunnel.

## 2. Tech Stack & Architecture
| Layer | Choice | Why |
|---|---|---|
| **Backend** | Node.js 20+ (Fastify) | Speed, WebSockets, TypeScript ecosystem |
| **Frontend** | Next.js 14 (PWA) | React, installable, mobile-first |
| **Terminal** | `node-pty` + `xterm.js` | Real PTY behavior in the browser |
| **Tunnel** | Cloudflare Tunnel | No port forwarding, reliable, watchdog monitored |
| **AI** | Ollama (Local) | Voice + text instructions to local models |
| **Auth** | PIN + bcrypt + JWT | Simple, secure, session-based |
| **Process** | PM2 | Keeps the Rove server and dev servers alive |

## 3. Core Features & Phase Breakdown

### Phase 1: Foundation (Current Focus)
- pnpm workspace setup.
- Fastify server with health checks.
- Configuration loading (.env & rove.config.json).
- Security middleware (helmet, cors, cookie).

### Phase 2: Authentication
- PIN-based login (4-8 digits).
- Bcrypt hashed storage in .env.
- JWT signed tokens with 7-day expiry.
- Protected API/WS routes.

### Phase 3: Terminal Management
- `node-pty` integration for real shell sessions.
- WebSocket streaming of PTY output/input.
- Session persistence (30 min timeout).
- Terminal resizing (SIGWINCH).

### Phase 4: Tunnel & Watchdog
- `cloudflared` child process management.
- Automatic URL extraction and status reporting.
- Watchdog loop with auto-restart logic.
- Uptime and restart counter tracking.

### Phase 5: Projects & Logs
- CRUD for project definitions in `rove.config.json`.
- child_process management for `npm run dev` etc.
- Real-time log streaming via WebSockets.

### Phase 6: File Browser
- Recursive file tree within `allowedPaths`.
- Read-only file content viewing with syntax highlighting.
- Strict path traversal prevention.

### Phase 7: AI Bridge (Ollama)
- Local Ollama API integration.
- Voice-to-text (Web Speech API) -> Confirm -> AI execute.
- Command extraction from AI responses.

### Phase 8: Dev Server Proxy
- Dynamic HTTP proxying from `/proxy/:projectId` to localhost ports.
- Preview iframe in the mobile UI.

### Phase 9: PWA Client (Mobile UI)
- Bottom navigation (Terminal, Preview, AI, Files, Projects).
- Dark mode, Tailwind CSS, JetBrains Mono font.
- Native feel with PWA manifest and service workers.

### Phase 10: Polish & Distribution
- `install.sh` for one-command setup.
- PM2 `ecosystem.config.js`.
- Comprehensive documentation.

## 4. Security Model
- All management traffic runs over Cloudflare Tunnel (HTTPS).
- JWT required for all interactions post-login.
- File system access strictly scoped.
- Rate limiting on login attempts.

## 5. UI/UX Principles
- Dark theme default.
- Large touch targets (min 44x44px).
- Low latency terminal feedback.
- Confirm-before-action for AI commands.
