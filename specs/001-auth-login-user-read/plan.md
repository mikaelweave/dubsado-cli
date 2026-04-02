# Implementation Plan: Auth Login & User Read

**Branch**: `001-auth-login-user-read` | **Date**: 2026-04-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-auth-login-user-read/spec.md`

## Summary

Implement the foundational auth layer for the Dubsado CLI and a single read-only smoke-test command (`dubsado user me`). Auth targets the Dubsado v2 API (`hello.dubsado.com`) which requires only a JWT `token` cookie for authenticated GET requests — no CSRF tokens needed. Auth supports three modes: browser login via Playwright (default), session import/export for remote machines, and headless credential login for agentic/CI environments. All commands output JSON in the standard `{ ok, data?, error? }` envelope. The `dubsado user me` command calls `GET /api/users/self` to prove the auth flow works end-to-end.

## Technical Context

**Language/Version**: TypeScript (strict mode), Node.js 20 LTS
**Primary Dependencies**: `commander` (CLI framework), `playwright-core` (browser login), native `fetch` (HTTP)
**Storage**: `~/.config/dubsado-cli/session.json` (file-based, mode 0600)
**Testing**: Vitest; integration tests with recorded HTTP fixtures
**Target Platform**: macOS, Linux (Node.js 20+)
**Project Type**: CLI
**Performance Goals**: N/A — single-user CLI tool
**Constraints**: No live API calls in CI; Playwright only required for browser login mode
**Scale/Scope**: Single user, single session, 5 commands in this feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. CLI-First | ✅ PASS | All 5 commands follow `dubsado <resource> <action>` pattern: `auth login`, `auth export`, `auth status`, `auth logout`, `user me`. stdout=JSON, stderr=diagnostics. |
| II. LLM-Optimized Output | ✅ PASS | All commands return `{ ok, data?, error? }` envelope. Skill file entry is a deliverable in this feature. |
| III. Session-Cookie Auth | ✅ PASS | JWT `token` cookie captured via Playwright and persisted to `session.json` (mode 0600). v2 API needs only this token for GET requests. No CSRF. Expired sessions produce clear re-auth error. |
| IV. Read-Before-Write | ✅ PASS | This feature is read-only. `user me` is GET-only. No write operations. |
| V. Simplicity and Scope | ✅ PASS | `commander` (minimal CLI), native `fetch` (no Axios), `playwright` justified by browser-based auth. v2 API eliminates CSRF complexity. One command per action. |

**GATE RESULT**: ALL PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-login-user-read/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── research-api-auth.md # Pre-existing auth investigation
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── checklists/          # Quality checklists
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── cli/
│   ├── index.ts              # Entry point, commander setup
│   ├── auth/
│   │   ├── login.ts          # dubsado auth login (mode dispatch)
│   │   ├── login-browser.ts  # Playwright browser login
│   │   ├── login-headless.ts # Direct POST credential login
│   │   ├── login-import.ts   # Session blob import
│   │   ├── export.ts         # dubsado auth export
│   │   ├── status.ts         # dubsado auth status
│   │   └── logout.ts         # dubsado auth logout
│   └── user/
│       └── me.ts             # dubsado user me
├── lib/
│   ├── session.ts            # Session read/write/validate (JWT token only)
│   ├── http.ts               # Authenticated fetch wrapper (JWT cookie replay)
│   ├── output.ts             # JSON envelope formatting + --pretty
│   └── constants.ts          # Base URL, config paths
└── types/
    ├── session.ts            # Session type definition
    └── user.ts               # User profile type definition

tests/
├── fixtures/
│   ├── user-self-200.json    # Recorded /api/user/self success response
│   ├── user-self-401.json    # Recorded expired session response
│   └── session-valid.json    # Valid session fixture
├── unit/
│   ├── session.test.ts       # Session read/write/validate
│   ├── http.test.ts          # Auth header injection, CSRF extraction
│   ├── output.test.ts        # Envelope formatting
│   └── user-me.test.ts       # Response mapping, field filtering
└── integration/
    ├── auth-login.test.ts    # Login flow (mocked Playwright context)
    ├── auth-import.test.ts   # Import/export round-trip
    └── user-me.test.ts       # Full command with fixture replay

skills/
└── dubsado.md                # LLM skill file — command reference

package.json
tsconfig.json
vitest.config.ts
```

**Structure Decision**: Single-project layout (Option 1 from template). CLI tool with no frontend/backend split. `src/cli/` for command handlers, `src/lib/` for shared utilities, `src/types/` for type definitions.

## Complexity Tracking

> No constitution violations — this section is intentionally empty.

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design artifacts were generated.*

| Principle | Status | Post-Design Evidence |
| --- | --- | --- |
| I. CLI-First | ✅ PASS | All 5 commands in contracts/cli-commands.md follow `dubsado <resource> <action>`. stdout=JSON, stderr=diagnostics. |
| II. LLM-Optimized Output | ✅ PASS | Every command has explicit JSON envelope in contracts. `--pretty` flag documented. Skill file is a project structure deliverable. |
| III. Session-Cookie Auth | ✅ PASS | Session entity in data-model.md captures JWT `token` value. Three login modes. File mode 0600. v2 API needs only token cookie for reads. |
| IV. Read-Before-Write | ✅ PASS | `user me` is GET only. Auth commands are session management, not data mutation. |
| V. Simplicity and Scope | ✅ PASS | 3 packages: `commander`, `playwright-core`, native `fetch`. No unnecessary abstractions. |

**GATE RESULT**: ALL PASS — ready for task generation.
