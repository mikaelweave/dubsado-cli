# Implementation Plan: Read Client & Form Entities

**Branch**: `002-read-addressbook-submittal` | **Date**: 2026-04-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-read-addressbook-submittal/spec.md`

## Summary

Add four read-only CLI commands for two new Dubsado entities: clients (`client list`, `client get <id>`) and forms (`form list`, `form get <id>`). Client listing uses the paginated search endpoint (`/api/clients/search`). Form listing uses `/api/forms/?populate=true`. Both reuse the existing `authenticatedFetch()`, output envelope, and `--pretty` flag from feature 001. Each entity gets a TypeScript type, a response mapper (strip internal fields, normalize dates), unit tests for the mapper, and integration tests for the command.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node.js 20 LTS
**Primary Dependencies**: `commander` (CLI framework), native `fetch` (HTTP) — no new dependencies
**Storage**: N/A (read-only commands; session from feature 001)
**Testing**: Vitest; unit tests for mappers, integration tests with recorded HTTP fixtures
**Target Platform**: macOS, Linux (Node.js 20+)
**Project Type**: CLI
**Performance Goals**: N/A — single-user CLI tool
**Constraints**: No live API calls in CI; read-only (no CSRF needed)
**Scale/Scope**: Single user, 4 new commands, 2 new entity types

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
| --------- | ------ | -------- |
| I. CLI-First | ✅ PASS | 4 new commands follow `dubsado <resource> <action>`: `client list`, `client get`, `form list`, `form get`. stdout=JSON, stderr=diagnostics. |
| II. LLM-Optimized Output | ✅ PASS | All commands return `{ ok, data?, error? }` envelope. Skill file update is a deliverable. |
| III. Session-Cookie Auth | ✅ PASS | Reuses `authenticatedFetch()` with JWT `token` cookie from feature 001. No auth changes needed. |
| IV. Read-Before-Write | ✅ PASS | All 4 commands are read-only GET requests. No write operations. |
| V. Simplicity and Scope | ✅ PASS | No new dependencies. Follows exact same pattern as `user me`. One mapper per entity. No speculative features. |

**GATE RESULT**: ALL PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-read-addressbook-submittal/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── checklists/          # Quality checklists
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── cli/
│   ├── index.ts              # Updated: register client + form subcommands
│   ├── client/
│   │   ├── list.ts           # dubsado client list
│   │   └── get.ts            # dubsado client get <id>
│   └── form/
│       ├── list.ts           # dubsado form list
│       └── get.ts            # dubsado form get <id>
├── types/
│   ├── index.ts              # Updated: re-export new types
│   ├── client.ts             # Client type definition
│   └── form.ts               # Form type definition
└── lib/                      # No changes — reuse http.ts, output.ts, session.ts

tests/
├── fixtures/
│   ├── client-list-200.json      # Recorded /api/clients/search response
│   ├── client-get-200.json       # Recorded single client response
│   ├── form-list-200.json        # Recorded /api/forms/?populate=true response
│   └── form-get-200.json         # Recorded single form response
├── unit/
│   ├── client-list.test.ts       # Mapper unit tests
│   ├── client-get.test.ts        # Mapper unit tests
│   ├── form-list.test.ts         # Mapper unit tests
│   └── form-get.test.ts          # Mapper unit tests
└── integration/
    ├── client-list.test.ts       # CLI integration tests
    ├── client-get.test.ts        # CLI integration tests
    ├── form-list.test.ts         # CLI integration tests
    └── form-get.test.ts          # CLI integration tests
```

**Structure Decision**: Extends the existing single-project layout from feature 001. Each new entity gets its own `src/cli/<entity>/` directory with `list.ts` and `get.ts`, matching the `src/cli/user/me.ts` pattern. Types go in `src/types/<entity>.ts`.
