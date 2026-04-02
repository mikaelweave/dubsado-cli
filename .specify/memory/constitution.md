<!--
SYNC IMPACT REPORT
==================
Version change:        (none) → 1.0.0 (initial ratification)
Modified principles:   N/A — initial document
Added sections:        Core Principles (I–V), Technology Stack, Development Workflow, Governance
Removed sections:      N/A

Templates requiring updates:
  ✅ .specify/templates/plan-template.md     — Constitution Check gates deferred to runtime read;
                                               no structural change needed
  ✅ .specify/templates/spec-template.md     — No mandatory section additions required
  ✅ .specify/templates/tasks-template.md    — Testing marked OPTIONAL aligns with Principle IV
  ✅ .specify/templates/checklist-template.md — Generic; no constitution-specific changes needed
  ⚠  .specify/templates/commands/            — Directory does not exist in this project;
                                               agents live in .github/agents/ — reviewed, no
                                               agent-specific (CLAUDE-only) references found

Deferred TODOs:        None
-->

# Dubsado CLI Constitution

## Core Principles

### I. CLI-First

Every Dubsado operation MUST be exposed as a discrete CLI command. Commands follow the
pattern `dubsado <resource> <action>` (e.g. `dubsado projects list`, `dubsado clients get <id>`).
All output goes to stdout; errors and diagnostics go to stderr. There are no GUI, SDK, or
library-only interfaces — the CLI is the sole interface contract.

### II. LLM-Optimized Output

All commands MUST emit JSON by default using a consistent envelope: `{ ok, data?, error? }`.
Response shapes MUST be predictable and stable across all commands. A `--pretty` flag MAY
enable human-readable formatting. The companion skill file is the primary discovery mechanism
for LLM consumers and MUST be kept in sync with every CLI command — a command without a skill
file entry is considered incomplete.

### III. Session-Cookie Authentication

Dubsado has no public API. Authentication MUST replicate browser session behavior: a
`dubsado auth login` command POSTs credentials, captures `Set-Cookie` response headers, and
persists cookies plus CSRF token to `~/.config/dubsado-cli/session.json` (file mode 0600).
All subsequent requests MUST replay the session cookies and the `x-csrf-token` / `x-brand`
headers. On session expiry (401 or login-redirect response), the CLI MUST exit with a clear
re-auth error message — never silently retry or swallow stale-session failures.

### IV. Read-Before-Write

Phase 1 MUST be read-only. Write operations (create, update, delete) are deferred to Phase 2.
No write command MAY be merged until the read surface for that resource is complete, tested,
and documented in the skill file. This discipline prevents destructive changes to live Dubsado
data while the API surface is being reverse-engineered from browser traffic.

### V. Simplicity and Scope

Each command does exactly one thing. YAGNI applies — no speculative flags, no auto-pagination
wrappers, no caching layer until demonstrably needed. Every dependency MUST be justified;
prefer Node.js built-ins and well-maintained single-purpose packages over large frameworks.
Complexity MUST be earned, not anticipated.

## Technology Stack

- **Runtime**: Node.js LTS, TypeScript (strict mode enabled)
- **CLI framework**: `commander` — minimal, no code generation scaffolding
- **HTTP**: Native `fetch` (Node 18+) — no Axios or got
- **Auth storage**: `~/.config/dubsado-cli/session.json` (XDG-compatible, mode 0600)
- **Testing**: Vitest; integration tests use recorded HTTP fixtures — no live API calls in CI
- **Output envelope**: `{ ok: boolean, data?: unknown, error?: string }`
- **Initial read resources**: clients, projects, invoices, leads, forms, workflows

## Development Workflow

- Commands are added resource-by-resource: complete read commands for one resource before
  starting the next.
- Every command MUST have: unit tests covering output shaping and error paths; a skill file
  entry with usage example; a README entry.
- HTTP responses from the Dubsado API MUST be recorded as fixtures for integration tests.
  Live API calls are never made in CI.
- The skill file (`skills/dubsado.md` or equivalent) is a first-class deliverable. It
  advertises available CLI commands to LLM consumers and is the primary interface contract
  for agents. Users of the skill are expected to extend and scope it for their business domain.

## Governance

This constitution supersedes all other practices. Amendments require a rationale in the PR,
a version bump per semantic versioning (MAJOR: principle removal or redefinition; MINOR: new
principle or section added; PATCH: clarification or wording fix), and an updated Sync Impact
Report in this file.

All feature plans MUST include a Constitution Check gate before Phase 0 research and again
after Phase 1 design.

**Version**: 1.0.0 | **Ratified**: 2026-04-02 | **Last Amended**: 2026-04-02
