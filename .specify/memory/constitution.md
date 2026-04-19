# Rove Constitution

## Core Principles

### I. AI-Native Development
Every module must be clean, well-commented, and structurally simple to ensure AI agents (Claude, Cursor, Antigravity) can easily reason about, modify, and fix the code.

### II. Realtime-First Architecture
The system prioritizes real-time feedback. WebSockets are the primary communication channel for terminal output, logs, and AI streaming, avoiding polling mechanisms.

### III. Mobile-Optimized Experience
The primary interface is a PWA designed for phone screens. UI/UX decisions must prioritize touch targets, mobile responsiveness, and dark mode for prolonged developer use.

### IV. Self-Healing & Resilience
Rove must detect and recover from failures automatically. This includes tunnel watchdogs, process monitors (PM2), and proactive user notifications when manual intervention is needed.

### V. Security & Privacy (Non-Negotiable)
Secure by default. Multi-factor-like PIN auth, signed session tokens, and zero-trust transport via Cloudflare Tunnel. No user data is stored in the cloud.

### VI. Cross-Platform Compatibility
While optimized for Arch Linux, the codebase must remain compatible with major OSes (Ubuntu, macOS, Windows/WSL) by abstracting platform-specific terminal and process logic.

## Security Requirements
- PIN/Password authentication with bcrypt hashing.
- Signed JWT session tokens for all API and WebSocket communication.
- HTTPS only for remote access (via Cloudflare).
- Path traversal protection for the file browser.

## Development Workflow
1. **Spec-Driven**: Changes start with a specification and implementation plan.
2. **Phase-Based**: Features are implemented in the order defined in the master build plan.
3. **Verify-Before-Next**: Each phase must be fully verified and operational before moving to the next.

## Governance
This constitution supersedes ad-hoc development decisions. Amendments require documentation and a rationale for changing the core vision of Rove.

**Version**: 1.0.0 | **Ratified**: 2026-04-18 | **Last Amended**: 2026-04-18
