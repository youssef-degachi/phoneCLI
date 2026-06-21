# phoneCLI

phoneCLI is a self-hosted remote development command center. It lets you check your machine from a phone, start and stop configured dev projects, open a real terminal, expose local ports through Cloudflare Tunnel, browse allowed files, and use a local Ollama-powered AI helper.

## Credits

Built by [Youssef Degachi](https://github.com/youssef-degachi).
Created with support from [Khalid Rouissi](https://github.com/khalidRouissi1/).
Developed under [NEXT Vision Services](https://gonextvision.com/).
NEXT Vision Services builds business applications, AI automation, and future-focused software.
Together, we build practical tools for today and ambitious projects for what comes next.

The project is a pnpm monorepo:

- `server/` - Fastify + TypeScript backend on port `4242`.
- `client/` - Next.js App Router frontend on port `4000`.
- `rove.config.json` - local project, file access, and tunnel configuration.
- `.env` - backend secrets and runtime settings.

## Features

- **PIN login**: bcrypt PIN verification with JWT cookie sessions.
- **Dashboard**: mobile-first status page showing CPU load, RAM usage, tunnel status, and configured project status.
- **Project control**: start, stop, and restart projects from `rove.config.json`.
- **Project proxy**: open a configured project's web UI through `/proxy/<project-id>`.
- **Remote terminal**: persistent PTY sessions over WebSockets using `node-pty` and `xterm.js`.
- **Run Host**: create ad-hoc Cloudflare quick tunnels for any local port.
- **Cloudflare Tunnel**: the client dev script starts a tunnel for the public UI gateway on port `4000`.
- **File browser**: browse and read files only inside `allowedPaths`.
- **AI assistant**: optional local AI chat through Ollama. It streams responses and extracts suggested commands from `<cmd>...</cmd>` tags.
- **Settings**: session/logout and app status view.

## Tech Stack

- **Backend**: Node.js, Fastify, TypeScript, Zod, JWT, bcrypt, `node-pty`, `systeminformation`.
- **Frontend**: Next.js `15.3.1`, React `19`, Tailwind CSS, xterm.js.
- **Package manager**: pnpm workspaces.
- **Remote access**: `cloudflared` quick or named tunnels.
- **Local AI**: Ollama API, default `http://localhost:11434`, model `llama3`.

## Requirements

- Node.js `20+`
- pnpm `9+`
- `cloudflared` in `PATH` for tunnel features
- Ollama, optional, for the AI page
- Linux build tools may be needed for native packages such as `node-pty` and `bcrypt`

## Setup

```bash
git clone git@github.com:youssef-degachi/phoneCLI.git
cd phoneCLI
pnpm install
cp .env.example .env
cp rove.config.json.example rove.config.json
```

Generate a bcrypt hash for your PIN:

```bash
cd server && node -e "const b = require('bcrypt'); b.hash('YOUR_NEW_PIN', 10).then(console.log)"
```

Example for PIN `1234`:

```bash
cd server && node -e "const b = require('bcrypt'); b.hash('1234', 10).then(console.log)"
```

Put the generated hash in `.env`:

```env
PORT=4242
HOST=0.0.0.0
NODE_ENV=development
PIN_HASH=$2b$10$...your_generated_hash...
JWT_SECRET=replace_with_at_least_32_random_characters
JWT_EXPIRY=7d
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

## Configure Projects

Edit `rove.config.json` to describe the local projects phoneCLI can manage:

```json
{
  "projects": [
    {
      "id": "my-app",
      "name": "My App",
      "path": "/absolute/path/to/my-app",
      "devCommand": "pnpm dev",
      "devPort": 3000,
      "color": "#6366f1"
    }
  ],
  "allowedPaths": ["/absolute/path/to/my-app"],
  "tunnel": {
    "mode": "quick",
    "autoRestart": true,
    "restartDelayMs": 3000,
    "maxRestarts": 10
  }
}
```

Notes:

- `projects[].path` is the working directory used when starting `devCommand`.
- `projects[].devPort` is used for status display and `/proxy/<id>`.
- `allowedPaths` controls what the file browser can access.
- Keep secrets out of `rove.config.json`; use `.env` for secrets.

## Run In Development

Start the backend:

```bash
pnpm dev:server
```

Start the frontend and Cloudflare tunnel:

```bash
pnpm dev:client
```

Open the local app:

```text
http://localhost:4000
```

The client terminal should print a public URL like:

```text
Tunnel live at: https://xxxxx.trycloudflare.com
```

Use that URL from your phone. The Next.js client on port `4000` is the public gateway and forwards these paths to the backend on port `4242`:

- `/api/*`
- `/ws/*`
- `/proxy/*`
- `/health`

You can also run both dev commands from the root with:

```bash
pnpm dev
```

For manual tunnel control, run Next.js without the tunnel:

```bash
pnpm --filter client dev:next
cloudflared tunnel --url http://localhost:4000
```

## Useful Commands

```bash
pnpm install
pnpm dev:server
pnpm dev:client
pnpm build
pnpm --filter server build
pnpm --filter client build
pnpm --filter client lint
pnpm --filter client dev:next
pnpm --filter client dev:tunnel
```

## App Routes

- `/login` - enter the PIN.
- `/dashboard` - system metrics, tunnel status, project list.
- `/projects/<id>` - start, stop, restart, open proxy, or open terminal.
- `/terminal` - WebSocket terminal sessions.
- `/run-host` - expose any local port with Cloudflare quick tunnel.
- `/settings` - app/session info and logout.
- `/files` - file browser, currently hidden from dashboard navigation but implemented.
- `/ai` - Ollama AI assistant, currently hidden from dashboard navigation but implemented.

## Backend Endpoints

- `GET /health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/verify`
- `GET /api/system/stats`
- `GET /api/projects`
- `POST /api/projects/:id/start`
- `POST /api/projects/:id/stop`
- `POST /api/projects/:id/restart`
- `GET /api/tunnel/status`
- `POST /api/tunnel/restart`
- `GET /api/tunnel/hosts`
- `POST /api/tunnel/hosts`
- `DELETE /api/tunnel/hosts/:id`
- `GET /api/files/tree?path=...`
- `GET /api/files/read?path=...`
- `WS /ws/terminal/:sessionId`
- `WS /ws/logs/:projectId`
- `WS /ws/ai`

## Claude Code, OpenCode, And AI Agent Notes

This section is for AI coding agents that need to understand and run the project.

1. Treat this as a pnpm monorepo. Run commands from the repository root unless a command explicitly uses `--filter`.
2. Do not edit generated build output in `client/.next/`.
3. Read `package.json`, `server/package.json`, `client/package.json`, `.env.example`, and `rove.config.json.example` before changing run scripts or config.
4. The backend reads `.env` and `rove.config.json` from the repository root while running from `server/`.
5. The frontend is the browser entrypoint on `http://localhost:4000`; the backend API is on `http://localhost:4242`.
6. Start development with two long-running processes: `pnpm dev:server` and `pnpm dev:client`.
7. If `cloudflared` is unavailable, use `pnpm --filter client dev:next` instead of `pnpm dev:client`.
8. If the AI page is being tested, make sure Ollama is running and the configured model exists, for example `ollama pull llama3`.
9. For native dependency problems, reinstall from the repo root with `pnpm install`; `node-pty` and `bcrypt` may require system build tooling.
10. Security-sensitive behavior lives in `server/src/auth`, `server/src/files`, `server/src/terminal`, and `server/src/config.ts`.

Suggested first-run sequence for Claude Code, OpenCode, or another AI agent:

```bash
pnpm install
cp .env.example .env
cp rove.config.json.example rove.config.json
cd server && node -e "const b = require('bcrypt'); b.hash('1234', 10).then(console.log)"
```

Then put the printed hash into `.env` as `PIN_HASH`, set a long `JWT_SECRET`, and run:

```bash
pnpm dev:server
pnpm dev:client
```

## Security

- The app is intended for self-hosted personal use.
- Access is protected by a PIN-derived bcrypt hash and JWT session cookie.
- WebSocket endpoints verify the JWT token.
- File access is scoped by `allowedPaths`.
- Cloudflare Tunnel avoids router port forwarding, but anyone with the URL can reach the login page.
- The terminal and project manager can execute commands on the host machine after login. Use a strong PIN and secret.

## Troubleshooting

- **`PIN_HASH is required`**: copy `.env.example` to `.env` and set `PIN_HASH`.
- **`JWT_SECRET must be at least 32 characters`**: set a longer random `JWT_SECRET`.
- **`cloudflared not found in PATH`**: install Cloudflare Tunnel or run `pnpm --filter client dev:next`.
- **No public tunnel URL appears**: check `tunnel.log` and ensure port `4000` is reachable locally.
- **AI does not answer**: start Ollama, pull the configured model, and check `OLLAMA_BASE_URL`.
- **Terminal fails to start**: verify native dependencies installed correctly and the host supports PTY sessions.

## License

MIT