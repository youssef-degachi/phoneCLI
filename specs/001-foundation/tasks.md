# Tasks: Foundation

**Input**: Design documents from `/specs/001-foundation/`
**Prerequisites**: plan.md, spec.md

## Phase 1: Setup (Shared Infrastructure)
- [ ] T001 Initialize pnpm workspace root and `pnpm-workspace.yaml`
- [ ] T002 [P] Create `server/` and `client/` directories
- [ ] T003 Initialize base `package.json` for server and root

## Phase 2: Foundational (Backend)
- [ ] T004 Setup `server/tsconfig.json` and install dev dependencies (typescript, ts-node, etc.)
- [ ] T005 Implement `server/src/config.ts` with Zod validation for `.env` and `rove.config.json`
- [ ] T006 [P] Implement `server/src/index.ts` with Fastify initialization
- [ ] T007 Register security middleware: helmet, cors, and cookie
- [ ] T008 Implement `/health` endpoint

## Phase 3: Polish & Verification
- [ ] T009 Verify server build with `pnpm --filter server build`
- [ ] T010 Verify health check with `curl http://localhost:4242/health`
- [ ] T011 Create `.env.example` and `rove.config.json.example`
