# Ports Explained: 3000 vs 4242

## Why They Look The Same

Both `localhost:3000` and `localhost:4242` show the exact same UI.

**But they are NOT the same.** Here is why:

| Feature | Port 3000 (Frontend only) | Port 4242 (Backend gateway) |
|---|---|---|
| Login Page | ✅ | ✅ |
| Dashboard | ✅ | ✅ |
| API Calls | ✅ (via Next.js) | ✅ |
| **Terminal WebSocket** | ❌ BROKEN | ✅ Works |
| **AI WebSocket** | ❌ BROKEN | ✅ Works |
| **Cloudflare Tunnel** | ❌ Do not use | ✅ Use this |

Port **3000** is the raw Next.js frontend. WebSockets go to `ws://localhost:3000/ws/...` which doesn't exist there.

Port **4242** is the Fastify backend. It handles WebSockets *itself*, and proxies the UI from port 3000 in the background. So everything works through one port.

> **Rule**: Always use port **4242** (locally and via tunnel). Never share port 3000.

---

## Why "Rove Client" Starts Then Immediately Stops

The "Rove Client" project in the dashboard is configured to run `pnpm dev` inside the `/client` folder (port 3000).

When you click "Start", it works. But when port 3000 is **already in use**, the command crashes immediately.

**Most likely reason**: You already ran `pnpm dev:client` in a terminal, so port 3000 is taken. When the project tries to start again, it sees the port is busy and exits.

**To fix this, either:**
1. Let Rove manage it (don't run `pnpm dev:client` manually in a terminal).
2. Or kill the existing process first:
   ```bash
   fuser -k 3000/tcp
   ```
   Then click Start in the dashboard.

---

## The Correct Way to Start Everything

```bash
# Terminal 1 - Backend
pnpm dev:server

# Terminal 2 - Frontend
pnpm dev:client

# Terminal 3 - Tunnel (for remote access)
cloudflared tunnel --url http://localhost:4242
```

Or use the single combined command:
```bash
pnpm dev
```
