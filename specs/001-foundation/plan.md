# Implementation Plan: Foundation

**Branch**: `001-foundation` | **Date**: 2026-04-18 | **Spec**: [spec.md]
**Input**: Feature specification from `/specs/001-foundation/spec.md`

## Summary
Initialize the pnpm workspace and build a basic Fastify server with configuration loading and a health check endpoint.

## Technical Context
**Language/Version**: TypeScript 5.x / Node.js 20+  
**Primary Dependencies**: Fastify, pino, dotenv, zod (for config validation)  
**Storage**: N/A for Phase 1  
**Testing**: Simple curl-based health checks  
**Target Platform**: Linux (Arch, Ubuntu)  
**Project Type**: Multi-package monorepo  

## Constitution Check
- **AI-Native**: Clean directory structure and typed configuration.
- **Realtime-First**: Preparing foundation for WebSockets in upcoming phases.
- **Security**: Integrating `@fastify/helmet` and `@fastify/cors` from day one.

## Project Structure

### Documentation (this feature)
```text
specs/001-foundation/
├── plan.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)
```text
server/
├── src/
│   ├── index.ts        # Fastify entry 
│   ├── config.ts       # Zod-based config loader
│   └── plugins/        # Fastify plugins (security, etc.)
├── package.json
└── tsconfig.json

client/
└── package.json        # Minimal placeholder for pnpm workspace

package.json            # Workspace root
pnpm-workspace.yaml
```

**Structure Decision**: Monorepo structure using pnpm workspaces to separate backend and frontend while sharing the root directory.
