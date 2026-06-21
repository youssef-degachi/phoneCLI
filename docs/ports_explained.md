# Ports Explained: 4000 vs 4242

## TL;DR

- **Port 4000** = Next.js client (the public gateway). This is what the Cloudflare tunnel points at.
- **Port 4242** = Fastify backend (API + WebSockets). The client proxies to it.

## Why The Two Ports Look The Same

Both `localhost:4000` and `localhost:4242` show the same UI:

- `localhost:4000` is the Next.js dev server. It rewrites `/api/*`, `/ws/*`, `/proxy/*`, and `/health` to `localhost:4242`, so calls just work.
- `localhost:4242` is Fastify. It serves the API and WebSockets natively, and proxies any other request to `localhost:4000` so the UI loads there too.

**But the tunnel must point at 4000.** The client is the proper public entry point in dev:

| Feature              | Port 4000 (client) | Port 4242 (backend) |
|----------------------|--------------------|---------------------|
| Login page           | ✅                 | ✅                  |
| Dashboard            | ✅                 | ✅                  |
| API calls            | ✅ (rewritten)     | ✅ (native)         |
| Terminal WebSocket   | ✅ (rewritten)     | ✅ (native)         |
| AI WebSocket         | ✅ (rewritten)     | ✅ (native)         |
| Cloudflare tunnel    | ✅ Use this        | ❌                  |

> **Rule**: Run the tunnel against **4000**. The server auto-tunnel already does this.

---

## Why "Rove Client" Starts Then Immediately Stops

The "Rove Client" project in the dashboard runs `pnpm dev` inside `/client` (port 4000).

If port 4000 is **already in use** (e.g. you already ran `pnpm dev:client` in a terminal), the dashboard-managed copy will exit instantly.

**Fix**:
1. Let Rove manage it (don't run `pnpm dev:client` manually), or
2. Kill the existing process first:
   ```bash
   fuser -k 4000/tcp
   ```
   Then click Start in the dashboard.

---

## The Correct Way To Start Everything

```bash
# Terminal 1 - Backend (also auto-starts the cloudflared tunnel pointing at 4000)
pnpm dev:server

# Terminal 2 - Frontend
pnpm dev:client
```

Or use the combined command:

```bash
pnpm dev
```

If you want to run the tunnel manually instead of via the auto-tunnel:

```bash
cloudflared tunnel --url http://localhost:4000
```
