# Technology Stack

Rove is built using modern, industry-standard technologies to ensure stability, security, and performance.

### Backend
-   **Language**: TypeScript / Node.js
-   **Framework**: Fastify (high performance, low overhead)
-   **Process Management**: `node-pty` (for real terminal emulation)
-   **System Stats**: `systeminformation`
-   **Security**: `bcrypt` (hashing), `jsonwebtoken` (JWT), `@fastify/helmet`
-   **Networking**: `@fastify/http-proxy`, `@fastify/websocket`, `@fastify/reply-from`

### Frontend
-   **Framework**: Next.js 15 (React)
-   **Styling**: Tailwind CSS
-   **UI Components**: Shadcn/UI (Radix Primitives)
-   **Icons**: Lucide React
-   **Terminal UI**: `xterm.js`
-   **State Management**: React Hooks (useState/useEffect)

### External Tools
-   **Cloudflare Tunnel**: Provides secure public URLs without port forwarding.
-   **Pnpm**: High-speed, disk-efficient package management.
-   **Ollama**: Local LLM runner for the AI features.
