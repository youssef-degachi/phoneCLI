# Feature Specification: Rove Foundation

**Feature Branch**: `001-foundation`  
**Created**: 2026-04-18  
**Status**: Draft  
**Input**: Build order Phase 1 from project_idea.md

## User Scenarios & Testing

### User Story 1 - Project Initialization (Priority: P1)
As a developer, I want a structured monorepo environment so I can manage both backend and frontend components efficiently.

**Why this priority**: Essential for all future development.
**Independent Test**: Verify `pnpm-workspace.yaml` exists and `pnpm install` works across packages.

**Acceptance Scenarios**:
1. **Given** no project structure, **When** initialized, **Then** `server/` and `client/` directories exist.
2. **Given** the workspace, **When** `pnpm install` is run, **Then** dependencies are linked correctly.

---

### User Story 2 - Basic API Server (Priority: P2)
As a user, I want a running backend server with basic security headers and a health check so I know the system is alive and safe.

**Why this priority**: The core engine of Rove.
**Independent Test**: `curl http://localhost:4242/health` returns `{ ok: true }`.

**Acceptance Scenarios**:
1. **Given** the server is started, **When** hitting `/health`, **Then** it returns 200 OK.
2. **Given** a request, **When** inspected, **Then** security headers (helmet) are present.

---

### User Story 3 - Configuration Loader (Priority: P3)
As a developer, I want the server to load settings from `.env` and `rove.config.json` so the app is configurable without code changes.

**Why this priority**: Required for tunnel, auth, and project management.
**Independent Test**: Server fails to start if required environment variables are missing.

**Acceptance Scenarios**:
1. **Given** valid config files, **When** server starts, **Then** config is loaded into memory correctly.

## Requirements

### Functional Requirements
- **FR-001**: MUST use pnpm workspaces for `server` and `client`.
- **FR-002**: MUST use Fastify as the backend framework.
- **FR-003**: MUST implement a `/health` endpoint.
- **FR-004**: MUST load and validate `.env` and `rove.config.json` on startup.
- **FR-005**: MUST include helmet, cors, and cookie middleware.

## Success Criteria

### Measurable Outcomes
- **SC-001**: Server starts in under 2 seconds.
- **SC-002**: 100% of Phase 1 functional requirements implemented.

## Assumptions
- Node.js 20+ is installed on the system.
- User has basic terminal access to run the install commands.
