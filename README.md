# Rove 🛰️

Rove is a self-hosted, open-source remote development command center designed for control from a mobile device.

## Features
- **Secure Access**: PIN-based authentication with JWT session management.
- **Remote Terminal**: Real-time PTY sessions via WebSockets (node-pty + xterm.js).
- **Project Monitoring**: Manage development servers and view logs remotely.
- **Cloudflare Tunnel**: Built-in watchdog for secure external access without port forwarding.
- **AI Assistant**: Locally powered AI chat (via Ollama) to help manage your PC and generate commands.
- **File Browser**: Secure, scoped file navigation and reading.

## Tech Stack
- **Backend**: Fastify (Node.js), TypeScript.
- **Frontend**: Next.js 14 (App Router, PWA, Tailwind CSS).
- **Transport**: Cloudflare Tunnel (cloudflared).
- **Process Management**: Child processes + Watchdog.

## Quick Start

### 1. Requirements
- Node.js 20+
- pnpm 9+
- cloudflared (installed in PATH)
- Ollama (optional, for AI features)

### 2. Setup
```bash
git clone <repo-url>
cd rove
pnpm install
```

### 3. Configuration
Copy the examples and fill in your details:
```bash
cp .env.example .env
cp rove.config.json.example rove.config.json
```
*Note: Follow the instructions in `.env.example` to generate your PIN hash.*

### 4. Run
```bash
# Start in development mode
pnpm dev:server
pnpm dev:client
```

## Security
- All traffic is HTTPS protected via Cloudflare Tunnel.
- JWT tokens are stored in `httpOnly` secure cookies.
- File system access is strictly restricted to `allowedPaths` in `rove.config.json`.
- PIN hashing uses bcrypt.

## License
MIT



to update the code pin  use 
```bash
cd server && node -e "const b = require('bcrypt'); b.hash('YOUR_NEW_PIN', 10).then(console.log)"
```
exomple
```bash
cd server && node -e "const b = require('bcrypt'); b.hash('1234', 10).then(console.log)"
```