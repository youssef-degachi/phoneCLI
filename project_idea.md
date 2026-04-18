# ROVE — Agent Build Prompt & Full Specification
> Give this entire document to your AI agent (Claude Code / Cursor / Antigravity).  
> It contains: the mission, full tech spec, folder structure, every feature, API contracts, docs links, and step-by-step build order.

---

## 0. WHO YOU ARE & WHAT YOU ARE BUILDING

You are an expert full-stack engineer. You will build **Rove** — an open-source, self-hosted remote developer command center.

**The problem it solves:**  
A developer is away from their PC (in a taxi, visiting a place, etc.) with only their phone. Their Arch Linux PC is at home running 24/7. They need to:
- Talk to AI agents (Claude Code, Cursor, Antigravity) and give them tasks
- See live UI previews of running dev servers
- Read terminal output / logs in real time
- Control a full terminal from their phone
- Browse and view project files
- Start/stop/restart dev servers
- Recover automatically if the tunnel connecting phone → PC breaks

**It must work:**
- On Arch Linux primarily, but also Ubuntu, macOS, Windows (cross-platform)
- Fully open source (MIT license)
- As a PWA — accessible from any phone browser AND installable like a native app
- Without Tailscale — uses Cloudflare Tunnel for remote access
- With a single install script

---

## 1. CORE PRINCIPLES

1. **AI agents write and fix all code** — keep every module clean, well-commented, and easy for an AI to reason about
2. **Realtime first** — use WebSockets everywhere, not polling
3. **Mobile-first UI** — the primary screen is a phone, not a desktop
4. **Self-healing** — tunnel watchdog, auto-restart, phone notifications on failures
5. **Security** — PIN/password auth + signed JWT session tokens, HTTPS only in production
6. **Zero cloud dependency** — everything runs on the user's own machine. Cloudflare Tunnel is only used for transport, no data stored there

---

## 2. TECH STACK

| Layer | Technology | Why |
|---|---|---|
| Backend runtime | **Node.js 20+ with TypeScript** | Fast, realtime WebSockets, runs on all platforms, massive ecosystem |
| Backend framework | **Fastify** | Faster than Express, built-in schema validation, great TypeScript support |
| WebSockets | **ws** library (native) | Low-level control, works great with Fastify |
| Terminal bridge | **node-pty** | Spawns real PTY (pseudo-terminal) processes — gives real xterm behavior |
| Frontend framework | **Next.js 14 (App Router)** | React as requested, PWA support, fast |
| Frontend terminal | **xterm.js** with xterm-addon-fit | Full terminal emulator in browser |
| AI bridge | **Ollama HTTP API** (local) | Local models for voice/chat commands |
| Tunnel | **Cloudflare Tunnel (cloudflared)** | Free, reliable, no port forwarding needed |
| Tunnel watchdog | Custom Node.js process monitor | Auto-restarts cloudflared on crash |
| Auth | **bcrypt** + **jsonwebtoken** | PIN hashing + signed JWT session tokens |
| Process manager | **PM2** | Keeps the Rove server alive, auto-start on boot |
| Config | **.env** + **JSON config file** | User picks projects, ports, PIN, etc. |
| Package manager | **pnpm** | Fast, disk-efficient |

---

## 3. REPOSITORY STRUCTURE

```
rove/
├── README.md
├── LICENSE                        # MIT
├── install.sh                     # One-command installer (Arch, Ubuntu, macOS, Windows)
├── package.json                   # Root workspace (pnpm workspaces)
├── pnpm-workspace.yaml
├── .env.example                   # Template — user copies to .env
├── rove.config.json.example       # Template — user copies to rove.config.json
│
├── server/                        # Node.js + TypeScript backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts               # Entry point — starts Fastify server
│   │   ├── config.ts              # Loads .env and rove.config.json, validates
│   │   ├── auth/
│   │   │   ├── auth.service.ts    # PIN verify, JWT sign/verify
│   │   │   └── auth.routes.ts     # POST /api/auth/login, POST /api/auth/logout
│   │   ├── terminal/
│   │   │   ├── terminal.manager.ts # Creates/destroys PTY sessions
│   │   │   └── terminal.ws.ts      # WebSocket handler — /ws/terminal/:sessionId
│   │   ├── tunnel/
│   │   │   ├── tunnel.manager.ts   # Spawns cloudflared, monitors, auto-restarts
│   │   │   └── tunnel.routes.ts    # GET /api/tunnel/status, POST /api/tunnel/restart
│   │   ├── proxy/
│   │   │   └── proxy.routes.ts     # GET /api/proxy — forwards to localhost dev servers
│   │   ├── files/
│   │   │   ├── files.service.ts    # Read/list files within allowed project folders
│   │   │   └── files.routes.ts     # GET /api/files/tree, GET /api/files/read
│   │   ├── projects/
│   │   │   ├── projects.service.ts # Start/stop/restart project dev servers
│   │   │   └── projects.routes.ts  # GET/POST /api/projects
│   │   ├── ai/
│   │   │   ├── ai.service.ts       # Talks to Ollama API
│   │   │   └── ai.ws.ts            # WebSocket handler — /ws/ai
│   │   ├── logs/
│   │   │   ├── logs.service.ts     # Tail process logs
│   │   │   └── logs.ws.ts          # WebSocket handler — /ws/logs/:projectId
│   │   └── notifications/
│   │       └── notifications.service.ts  # Push notifications (Web Push API)
│
├── client/                        # Next.js 14 PWA
│   ├── package.json
│   ├── next.config.js             # PWA config (next-pwa)
│   ├── public/
│   │   ├── manifest.json          # PWA manifest
│   │   └── icons/                 # App icons (512x512, 192x192, etc.)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Login page (PIN entry)
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Main app shell with bottom nav
│   │   │   ├── terminal/
│   │   │   │   └── page.tsx       # Full xterm.js terminal
│   │   │   ├── preview/
│   │   │   │   └── page.tsx       # Iframe dev server preview
│   │   │   ├── files/
│   │   │   │   └── page.tsx       # File tree + file viewer
│   │   │   ├── ai/
│   │   │   │   └── page.tsx       # Chat + voice interface to AI
│   │   │   ├── projects/
│   │   │   │   └── page.tsx       # Project list + start/stop/restart
│   │   │   └── settings/
│   │   │       └── page.tsx       # Config: projects, tunnel, AI model
│   │   └── api/                   # Next.js API routes (minimal — mostly proxies to server)
│   ├── components/
│   │   ├── Terminal.tsx           # xterm.js component
│   │   ├── VoiceInput.tsx         # Web Speech API voice-to-text
│   │   ├── DevPreview.tsx         # Iframe with toolbar
│   │   ├── FileTree.tsx           # Recursive file tree
│   │   ├── AiChat.tsx             # Chat UI with confirm-before-execute
│   │   ├── ProjectCard.tsx        # Project status + controls
│   │   ├── TunnelStatus.tsx       # Tunnel health indicator
│   │   └── BottomNav.tsx          # Mobile navigation bar
│   └── lib/
│       ├── api.ts                 # API client
│       ├── websocket.ts           # WebSocket client manager (auto-reconnect)
│       ├── auth.ts                # Token storage + refresh
│       └── voice.ts               # Web Speech API wrapper
│
└── docs/
    ├── INSTALL.md
    ├── CONFIGURATION.md
    ├── ARCHITECTURE.md
    └── CONTRIBUTING.md
```

---

## 4. CONFIGURATION FILES

### `.env.example` (copy to `.env`)
```env
# Server
PORT=4242
HOST=0.0.0.0
NODE_ENV=production

# Auth — CHANGE THIS to your own PIN hash (use: node -e "require('bcrypt').hash('YOUR_PIN',10).then(console.log)")
PIN_HASH=$2b$10$PLACEHOLDER_REPLACE_ME

# JWT — CHANGE THIS to a long random string
JWT_SECRET=REPLACE_WITH_LONG_RANDOM_SECRET_MIN_32_CHARS

# JWT expiry
JWT_EXPIRY=7d

# Tunnel
CLOUDFLARE_TUNNEL_TOKEN=        # Optional: if you have a named tunnel
CLOUDFLARE_TUNNEL_URL=          # Auto-filled by watchdog on quick tunnel start

# AI
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Notifications (optional — Web Push)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:you@example.com
```

### `rove.config.json.example` (copy to `rove.config.json`)
```json
{
  "projects": [
    {
      "id": "my-app",
      "name": "My App",
      "path": "/home/user/projects/my-app",
      "devCommand": "npm run dev",
      "devPort": 3000,
      "color": "#6366f1"
    }
  ],
  "allowedPaths": [
    "/home/user/projects"
  ],
  "tunnel": {
    "mode": "quick",
    "autoRestart": true,
    "restartDelayMs": 3000,
    "maxRestarts": 10
  },
  "notifications": {
    "enabled": false
  }
}
```

---

## 5. FEATURE SPECS — DETAILED

### 5.1 AUTH

- Single PIN (4–8 digits, stored as bcrypt hash in `.env`)
- On successful login → sign JWT → store in `httpOnly` cookie AND `localStorage` as fallback
- All API routes and WebSocket upgrades require valid JWT
- JWT expiry: 7 days (configurable)
- PIN entry UI: large number pad, mobile-friendly

**API:**
```
POST /api/auth/login    body: { pin: "1234" }   → { token, expiresAt }
POST /api/auth/logout   → clears cookie
GET  /api/auth/verify   → { valid: true/false }
```

---

### 5.2 TERMINAL

- Uses `node-pty` to spawn a real shell (`/bin/bash` or `$SHELL`)
- Each client session gets its own PTY
- PTY output streams over WebSocket as raw text
- Client input (keystrokes) sent over WebSocket → piped to PTY stdin
- Terminal resize events handled (SIGWINCH)
- Sessions survive phone disconnect — PTY stays alive for 30 mins, reconnect resumes session
- Multiple terminal tabs supported (each tab = new session ID)

**WebSocket:** `ws://localhost:4242/ws/terminal/:sessionId`

Messages from server → client:
```json
{ "type": "output", "data": "...raw terminal output..." }
{ "type": "exit", "code": 0 }
```

Messages from client → server:
```json
{ "type": "input", "data": "ls -la\r" }
{ "type": "resize", "cols": 80, "rows": 24 }
```

---

### 5.3 TUNNEL MANAGER

- Spawns `cloudflared tunnel --url http://localhost:4242` as a child process
- Parses stdout to extract the tunnel URL (matches `https://*.trycloudflare.com`)
- Stores URL in memory, exposes via API
- **Watchdog loop:** every 5 seconds checks if process is alive
- If dead: wait `restartDelayMs`, respawn, increment restart counter
- If `maxRestarts` exceeded: send push notification, stop retrying, require manual restart via API
- Restart counter resets after 10 minutes of stable uptime
- All tunnel events logged to `~/.rove/logs/tunnel.log`

**API:**
```
GET  /api/tunnel/status   → { alive: bool, url: string, restarts: number, uptime: ms }
POST /api/tunnel/restart  → { ok: true }
```

---

### 5.4 DEV SERVER PROXY & PREVIEW

- Each project config defines `devPort` (e.g., 3000)
- Rove proxies `/proxy/:projectId/*` → `http://localhost:{devPort}/*`
- Client-side: shows the proxied URL in an iframe
- Toolbar above iframe: refresh, open in new tab, copy URL, back/forward
- HTTPS is handled by Cloudflare Tunnel — so iframe works over HTTPS

**API:**
```
GET /proxy/:projectId/*   → proxied response from localhost:devPort
```

---

### 5.5 PROJECT MANAGER

- Projects defined in `rove.config.json`
- Each project can be started/stopped/restarted via API
- Dev server process managed as child process (separate from Rove itself)
- stdout/stderr streamed to WebSocket `/ws/logs/:projectId`
- Process status: stopped | starting | running | error
- On start: runs `devCommand` in `path` directory
- On stop: SIGTERM → wait 5s → SIGKILL

**API:**
```
GET  /api/projects              → [{ id, name, status, port, pid, uptime }]
POST /api/projects/:id/start    → { ok }
POST /api/projects/:id/stop     → { ok }
POST /api/projects/:id/restart  → { ok }
```

**WebSocket:** `ws://localhost:4242/ws/logs/:projectId`  
Streams: `{ "type": "log", "stream": "stdout"|"stderr", "data": "..." }`

---

### 5.6 FILE BROWSER

- Only serves files within `allowedPaths` from config — never anything outside
- Path traversal attack prevention: resolve all paths, reject any outside allowed roots
- Read-only by default (no write in v1 — add in v2)
- Supports: list directory, read file content, detect language for syntax highlighting

**API:**
```
GET /api/files/tree?path=/home/user/projects/my-app   → { tree: [...] }
GET /api/files/read?path=/home/user/projects/my-app/src/index.ts  → { content, language }
```

Tree node:
```json
{
  "name": "index.ts",
  "path": "/home/user/projects/my-app/src/index.ts",
  "type": "file" | "directory",
  "size": 1234,
  "children": []
}
```

---

### 5.7 AI CHAT (voice + text → action)

**Flow:**
1. User speaks (Web Speech API) or types instruction
2. Client shows instruction, asks user to **confirm or cancel** before sending
3. On confirm → sent over WebSocket to AI service
4. Server sends instruction to **Ollama** with system prompt
5. Ollama responds with a plan (what terminal commands to run / what to tell Claude Code)
6. Response shown in chat UI
7. If response contains terminal commands → optional "Run in terminal" button

**System prompt for Ollama:**
```
You are a remote developer assistant. The user is away from their PC and is giving you instructions via their phone. Your job is to help them understand what to do and provide exact terminal commands or instructions to carry out their request. Always be concise. If you suggest running commands, wrap them in a <cmd> tag so the UI can offer a one-click run button.
```

**WebSocket:** `ws://localhost:4242/ws/ai`

Client → server:
```json
{ "type": "message", "content": "Fix the TypeScript error in index.ts" }
```

Server → client (streamed):
```json
{ "type": "chunk", "content": "I'll check..." }
{ "type": "done", "content": "Full response here", "commands": ["npx tsc --noEmit"] }
```

**Voice input (client-side only):**
- Uses `window.SpeechRecognition` (Web Speech API — no server needed)
- Interim results shown live as user speaks
- On silence → auto-submit to confirm dialog
- Fallback: manual text input if speech not available

---

### 5.8 TUNNEL AUTO-RECOVERY NOTIFICATION

When tunnel dies and max restarts exceeded:
- Server sends Web Push notification to registered phone browsers
- Notification: "⚠️ Rove tunnel is down — tap to open settings"
- In-app: red banner on TunnelStatus component
- `/api/notifications/subscribe` → stores push subscription
- `/api/notifications/send` → internal, called by tunnel manager

---

## 6. PHONE UI — DETAILED SCREENS

### Navigation
Bottom nav bar (mobile-native feel) with 5 tabs:
1. 🖥️ **Terminal** — full xterm.js
2. 👁️ **Preview** — iframe dev server
3. 🤖 **AI** — chat + voice
4. 📁 **Files** — file tree + viewer
5. ⚡ **Projects** — project cards + controls

### Design system
- Dark theme by default (dev tool)
- Accent color: `#6366f1` (indigo)
- Font: `JetBrains Mono` for terminal/code, `Inter` for UI
- Mobile breakpoints: assume 390px wide minimum
- Touch targets: minimum 44x44px (Apple HIG)
- Use Tailwind CSS

### Terminal screen
- Full screen xterm.js — no padding waste
- Floating "+" button → new terminal tab
- Tab bar at top when multiple sessions
- Keyboard toolbar above soft keyboard: Tab, Ctrl, Esc, Arrow keys, common symbols (|, /, ~, -)
- Pinch to zoom font size

### Preview screen
- URL bar at top showing current proxied URL
- Dropdown to switch between projects
- Refresh, back, forward, open-in-browser toolbar
- Iframe takes remaining height

### AI screen
- Chat bubbles (user right, AI left)
- Sticky input bar at bottom: text input + mic button
- Mic button: tap to start voice, tap again to stop
- Confirm dialog appears before any instruction is sent to AI
- "Run in terminal" chip on messages containing `<cmd>` blocks
- AI thinking indicator (animated dots)

### Files screen
- Collapsible folder tree on left (or slide-in drawer on mobile)
- File content on right with syntax highlighting (use highlight.js)
- Breadcrumb navigation
- Language badge (TypeScript, Python, etc.)

### Projects screen
- Card per project: name, status badge, uptime, port
- Start / Stop / Restart buttons per card
- Tap card to expand → shows last 20 lines of logs
- Tunnel status banner at top (green = alive, red = down with restart button)

---

## 7. INSTALL SCRIPT (`install.sh`)

The install script must:

1. Detect OS (Arch Linux, Ubuntu/Debian, macOS, Windows via WSL check)
2. Install dependencies if missing:
   - Node.js 20+ (via `nvm` or system package manager)
   - pnpm
   - cloudflared
   - ollama (optional, ask user)
   - PM2 (`npm install -g pm2`)
3. Clone repo (or use current directory if already cloned)
4. Run `pnpm install`
5. Build server (`pnpm --filter server build`)
6. Build client (`pnpm --filter client build`)
7. Copy `.env.example` → `.env` and prompt user to set PIN
8. Copy `rove.config.json.example` → `rove.config.json` and prompt for first project path
9. Setup PM2: `pm2 start ecosystem.config.js && pm2 startup && pm2 save`
10. Start cloudflared quick tunnel, show the URL to user
11. Print final URL: `✅ Rove is running at: https://xxxx.trycloudflare.com`

---

## 8. PM2 ECOSYSTEM CONFIG (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: 'rove-server',
      script: './server/dist/index.js',
      watch: false,
      env: { NODE_ENV: 'production' },
      restart_delay: 3000,
      max_restarts: 20,
      log_file: '~/.rove/logs/server.log',
    }
  ]
}
```

---

## 9. SECURITY CHECKLIST

- [ ] All routes behind JWT middleware except `/api/auth/login` and `/health`
- [ ] WebSocket handshake verifies JWT token in query param or cookie
- [ ] File browser enforces allowedPaths — use `path.resolve()` and startsWith check
- [ ] Rate limit login endpoint (5 attempts per minute per IP) — use `@fastify/rate-limit`
- [ ] Helmet headers — use `@fastify/helmet`
- [ ] CORS restricted to the tunnel URL (dynamic)
- [ ] No secrets in client-side code
- [ ] Input sanitization on all file path parameters
- [ ] Terminal: restrict max sessions (default: 5 concurrent)

---

## 10. DOCS & REFERENCE LINKS

### Core dependencies — read these before writing code

| Package | Docs URL |
|---|---|
| Fastify | https://fastify.dev/docs/latest/ |
| node-pty | https://github.com/microsoft/node-pty#readme |
| ws (WebSockets) | https://github.com/websockets/ws#readme |
| xterm.js | https://xtermjs.org/docs/ |
| xterm-addon-fit | https://github.com/xtermjs/xterm.js/tree/master/addons/xterm-addon-fit |
| Next.js 14 App Router | https://nextjs.org/docs |
| next-pwa | https://github.com/shadowwalker/next-pwa#readme |
| Tailwind CSS | https://tailwindcss.com/docs |
| jsonwebtoken | https://github.com/auth0/node-jsonwebtoken#readme |
| bcrypt | https://github.com/kelektiv/node.bcrypt.js#readme |
| @fastify/rate-limit | https://github.com/fastify/fastify-rate-limit#readme |
| @fastify/helmet | https://github.com/fastify/fastify-helmet#readme |
| @fastify/http-proxy | https://github.com/fastify/fastify-http-proxy#readme |
| PM2 | https://pm2.keymetrics.io/docs/usage/quick-start/ |
| cloudflared | https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/ |
| Ollama API | https://github.com/ollama/ollama/blob/main/docs/api.md |
| Web Speech API | https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API |
| Web Push API | https://developer.mozilla.org/en-US/docs/Web/API/Push_API |
| web-push (npm) | https://github.com/web-push-libs/web-push#readme |
| highlight.js | https://highlightjs.org/usage |
| pnpm workspaces | https://pnpm.io/workspaces |

---

## 11. BUILD ORDER — STEP BY STEP

Build in this exact order. Each step should be fully working before moving to the next.

### Phase 1 — Foundation
1. Initialize pnpm workspace with `server/` and `client/` packages
2. Setup TypeScript in `server/`
3. Create `config.ts` — loads and validates `.env` + `rove.config.json`
4. Create basic Fastify server on configurable port
5. Add `@fastify/helmet`, `@fastify/cors`, `@fastify/cookie`
6. Add `/health` endpoint → `{ ok: true, version: "1.0.0" }`
7. Test: `curl http://localhost:4242/health`

### Phase 2 — Auth
8. Add bcrypt + jsonwebtoken
9. Create `auth.service.ts` — `verifyPin()`, `signToken()`, `verifyToken()`
10. Create `auth.routes.ts` — `POST /api/auth/login`
11. Add JWT middleware (Fastify hook) that protects all `/api/*` routes
12. Test: login with correct PIN → get token; test protected route with/without token

### Phase 3 — Terminal
13. Install `node-pty`
14. Create `terminal.manager.ts` — session map, createSession(), destroySession()
15. Create `terminal.ws.ts` — WebSocket upgrade handler at `/ws/terminal/:sessionId`
16. Test: connect with `wscat` → get a real bash shell

### Phase 4 — Tunnel
17. Install `cloudflared` detection (check if binary exists in PATH)
18. Create `tunnel.manager.ts` — spawn cloudflared, parse URL from stdout, watchdog loop
19. Create `tunnel.routes.ts` — `GET /api/tunnel/status`, `POST /api/tunnel/restart`
20. Test: start server → tunnel URL printed → accessible from phone browser

### Phase 5 — Projects & Logs
21. Create `projects.service.ts` — parse config, manage child processes
22. Create `projects.routes.ts` — start/stop/restart endpoints
23. Create `logs.ws.ts` — stream process stdout/stderr over WebSocket
24. Test: start a project, see logs stream in real time

### Phase 6 — Files
25. Create `files.service.ts` — listDirectory(), readFile() with path safety checks
26. Create `files.routes.ts` — tree and read endpoints
27. Test: request file tree for an allowed path, try path traversal (should 403)

### Phase 7 — AI Bridge
28. Create `ai.service.ts` — Ollama HTTP client, streaming response handler
29. Create `ai.ws.ts` — WebSocket handler that streams AI responses to client
30. Test: send a message → get streamed response from Ollama

### Phase 8 — Dev Proxy
31. Add `@fastify/http-proxy` 
32. Create `proxy.routes.ts` — dynamic proxy to project dev ports
33. Test: start a Next.js dev server on 3000, access via `/proxy/my-app/`

### Phase 9 — Next.js Client
34. Initialize Next.js 14 with TypeScript and Tailwind in `client/`
35. Add `next-pwa` and configure PWA manifest
36. Build login page (PIN pad UI)
37. Build app shell with bottom nav (5 tabs)
38. Build Terminal screen with xterm.js + WebSocket connection
39. Build Projects screen with cards + start/stop/restart
40. Build Preview screen with iframe proxy
41. Build AI chat screen with voice input (Web Speech API)
42. Build Files screen with file tree + syntax-highlighted viewer
43. Build Settings screen (project config, tunnel controls)
44. Add TunnelStatus banner component
45. Add auto-reconnect WebSocket client (exponential backoff)

### Phase 10 — Polish & Open Source
46. Write `install.sh` for Arch, Ubuntu, macOS
47. Write `ecosystem.config.js` for PM2
48. Write `README.md` with screenshots section placeholder
49. Write `docs/INSTALL.md`, `docs/CONFIGURATION.md`, `docs/ARCHITECTURE.md`
50. Add `CONTRIBUTING.md` 
51. Add GitHub Actions CI: lint + build check on PR
52. Final security audit: run through security checklist in section 9

---

## 12. ERROR HANDLING CONVENTIONS

- All API errors return: `{ error: { code: string, message: string } }`
- HTTP status codes: 400 bad input, 401 unauthorized, 403 forbidden, 404 not found, 500 server error
- WebSocket errors: send `{ type: "error", code: string, message: string }` then close
- All async errors caught — no unhandled promise rejections
- Server logs to `~/.rove/logs/` using `pino` (Fastify's default logger)

---

## 13. NAMING CONVENTIONS

- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- React components: `PascalCase.tsx`
- API routes: `/api/resource/:id/action` (REST)
- WebSocket routes: `/ws/resource/:id`
- Config keys: `camelCase` in JSON

---

## 14. WHAT NOT TO BUILD IN v1

Skip these for now — add in v2:
- File editing from phone (read-only in v1)
- Multiple user accounts (single PIN only)
- Git integration UI (use terminal for git)
- Cursor / Antigravity direct API integration (use terminal to interact with them)
- Mobile app (React Native / Flutter) — PWA is enough for v1
- Database (SQLite etc.) — config files only in v1
- Docker support — native install only in v1

---

## 15. FIRST COMMAND TO RUN

```bash
mkdir rove && cd rove && git init && echo "# Rove" > README.md && git add . && git commit -m "chore: init repo"
```

Then start with Phase 1, Step 1.

---

*Built for developers who don't stop working just because they left their desk.*  
*MIT License — open source forever.*