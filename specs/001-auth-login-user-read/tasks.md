# Tasks: Auth Login & User Read

**Input**: Design documents from `/specs/001-auth-login-user-read/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/cli-commands.md

**Tests**: Not explicitly requested in spec — included in Polish phase as project deliverables (plan.md lists test files).

**Organization**: Tasks grouped by user story. US1 (Auth) is MVP; US2 (User Read) builds on it.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the TypeScript CLI project with all dependencies and configuration.

- [X] T001 Initialize npm project with package.json (name: dubsado-cli, bin entry, type: module, engines: node >=20)
- [X] T002 [P] Create tsconfig.json with strict mode, ES2022 target, NodeNext module resolution
- [X] T003 [P] Create vitest.config.ts with test directory mapping
- [X] T004 Create directory structure: src/cli/auth/, src/cli/user/, src/lib/, src/types/, tests/fixtures/, tests/unit/, tests/integration/, skills/
- [X] T005 Install dependencies: commander, playwright-core (prod); vitest, typescript, @types/node (dev)

**Checkpoint**: Project compiles with `tsc --noEmit`, vitest runs (0 tests)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, utilities, and CLI skeleton that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 [P] Define Session interface and SessionVersion constant in src/types/session.ts per data-model.md (version, cookies object, csrfToken, brandId, capturedAt)
- [X] T007 [P] Define UserProfile interface in src/types/user.ts per data-model.md (id, email, firstName, lastName, locale, isLocked, isSoftLocked, isUnverified, createdAt)
- [X] T008 [P] Define OutputEnvelope type (ok/data/error) and re-export all types from src/types/index.ts
- [X] T009 [P] Implement constants in src/lib/constants.ts: BASE_URL (`https://app.dubsado.com`), SESSION_PATH (~/.config/dubsado-cli/session.json), COOKIE_NAMES array, LOGIN_TIMEOUT_MS (300000)
- [X] T010 [P] Implement output helpers in src/lib/output.ts: success(data), failure(error), print(envelope, pretty) — stdout for JSON, stderr for diagnostics
- [X] T011 Implement session manager in src/lib/session.ts: read(), write(session), exists(), remove(), validate(session) — file I/O at SESSION_PATH with mode 0600, version check, JSON parse with error handling
- [X] T012 Implement authenticated HTTP client in src/lib/http.ts: authenticatedFetch(path, options) — reads session, injects 4 cookies + x-csrf-token + x-brand headers, handles 401 detection (expired session error)
- [X] T013 Create CLI entry point in src/cli/index.ts: commander program with `dubsado` as root, `auth` and `user` subcommand groups, --pretty global option, version from package.json

**Checkpoint**: `npx tsx src/cli/index.ts --help` prints command tree with auth and user groups

---

## Phase 3: User Story 1 — Authenticate with Dubsado (Priority: P1) 🎯 MVP

**Goal**: Enable three auth modes (browser, import, headless) plus export/status/logout, so the CLI can make authenticated API requests.

**Independent Test**: Run `dubsado auth login` (any mode), confirm session.json is created on disk, then run `dubsado auth status` and verify it reports valid.

### Implementation for User Story 1

- [X] T014 [P] [US1] Implement browser login in src/cli/auth/login-browser.ts: launch Playwright chromium to BASE_URL login page, monitor for session cookies (session, csrf, publicSiteToken, sessionExpiry), extract CSRF UUID from signed cookie, detect x-brand from page requests, build Session object, write via session manager, handle timeout (--timeout flag) and browser-close cancellation, detect headless environment (no DISPLAY / no TTY) and exit with error suggesting --import or --headless mode
- [X] T015 [P] [US1] Implement headless login in src/cli/auth/login-headless.ts: accept email/password from flags or DUBSADO_EMAIL/DUBSADO_PASSWORD env vars (flags > env), POST credentials to Dubsado's login endpoint (see R7 in research.md — endpoint needs implementation-time verification from DevTools), parse Set-Cookie headers, extract CSRF UUID and brandId, build Session object, write via session manager
- [X] T016 [P] [US1] Implement session import in src/cli/auth/login-import.ts: accept base64 blob from --import flag argument or stdin (when arg is "-"), base64-decode, JSON parse, validate version === 1, validate all required Session fields present, write via session manager
- [X] T017 [US1] Implement login command dispatcher in src/cli/auth/login.ts: commander subcommand with --import, --headless, --email, --password, --timeout flags, route to login-browser (default), login-import (--import), or login-headless (--headless), output success/failure envelope
- [X] T018 [P] [US1] Implement auth export in src/cli/auth/export.ts: read session via session manager, JSON.stringify, base64-encode, output envelope with blob field per contracts/cli-commands.md
- [X] T019 [P] [US1] Implement auth status in src/cli/auth/status.ts: read session, make lightweight authenticated GET to /api/user/self via http.ts, if 200 → output authenticated=true + email + capturedAt, if 401/error → output session expired error, if no session → output not-authenticated error, warn on insecure file permissions
- [X] T020 [P] [US1] Implement auth logout in src/cli/auth/logout.ts: call session.remove(), output { ok: true, data: {} } per contracts/cli-commands.md, exit 0 even if no session existed
- [X] T021 [US1] Register all auth subcommands in src/cli/index.ts: wire login, export, status, logout under the `auth` command group

**Checkpoint**: `dubsado auth login` (browser mode) opens Chromium, captures session, `dubsado auth status` returns valid, `dubsado auth export` prints blob, `dubsado auth logout` removes session file

---

## Phase 4: User Story 2 — Read Current User Profile (Priority: P2)

**Goal**: Fetch and display the authenticated user's Dubsado profile via `GET /api/user/self`, proving end-to-end auth works.

**Independent Test**: After `dubsado auth login`, run `dubsado user me` and confirm output contains user's name and email.

### Implementation for User Story 2

- [X] T022 [US2] Implement user me command in src/cli/user/me.ts: call authenticatedFetch('/api/user/self'), map response fields per data-model.md (\_id→id, contact.firstName→firstName, contact.lastName→lastName, createdAt.$date→createdAt), strip excluded fields (hmac, churnkey, attribution, etc.), wrap in output envelope, handle not-authenticated and expired-session errors
- [X] T023 [US2] Register user me subcommand in src/cli/index.ts: wire me under the `user` command group

**Checkpoint**: `dubsado user me` returns JSON with id, email, firstName, lastName, locale, isLocked, isSoftLocked, isUnverified, createdAt

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Tests, documentation, and deliverables that span both user stories.

- [X] T024 [P] Create test fixtures in tests/fixtures/: user-self-200.json (recorded success response), user-self-401.json (expired session response), session-valid.json (valid session object)
- [X] T025 [P] Write unit tests in tests/unit/session.test.ts: read/write/validate round-trip, corrupt JSON handling, missing file handling, version mismatch rejection
- [X] T026 [P] Write unit tests in tests/unit/http.test.ts: cookie injection, CSRF header extraction from signed cookie, 401 detection and error message
- [X] T027 [P] Write unit tests in tests/unit/output.test.ts: success envelope, failure envelope, --pretty formatting
- [X] T028 [P] Write unit tests in tests/unit/user-me.test.ts: response field mapping, excluded field stripping, missing field handling
- [X] T029 Write integration tests in tests/integration/auth-login.test.ts: mock Playwright context, verify session file creation and content
- [X] T030 Write integration tests in tests/integration/auth-import.test.ts: export→import round-trip, invalid blob rejection, version mismatch
- [X] T031 Write integration tests in tests/integration/user-me.test.ts: full command with fixture replay, not-authenticated error, expired session error
- [X] T032 [P] Create LLM skill file in skills/dubsado.md: command reference for all 6 commands with flags, example invocations, and output shapes per contracts/cli-commands.md
- [X] T033 [P] Add npm scripts to package.json: "build" (tsc), "dev" (tsx), "test" (vitest), "lint" (tsc --noEmit)
- [X] T034 Run quickstart.md validation: walk through install → auth → verify flow end-to-end

**Checkpoint**: `npm test` passes, `npm run lint` passes, skill file is complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**
- **US1 Auth (Phase 3)**: Depends on Foundational phase completion
- **US2 User Read (Phase 4)**: Depends on Foundational phase completion (can start in parallel with US1, but practically needs session.ts from US1 for end-to-end test)
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **US1 (Auth)**: Can start after Phase 2. No dependencies on other stories.
- **US2 (User Read)**: Can start after Phase 2. Technically independent of US1 at the code level (uses http.ts from Phase 2), but end-to-end testing requires a valid session from US1.

### Within User Story 1

- T014, T015, T016 (three login modes) can run in **parallel** — different files, each writes via session manager independently
- T017 (login dispatcher) depends on T014, T015, T016
- T018, T019, T020 (export, status, logout) can run in **parallel** — independent commands
- T021 (register commands) depends on T017, T018, T019, T020

### Within User Story 2

- T022 (user me) depends on T012 (http.ts) from Phase 2
- T023 (register command) depends on T022

### Parallel Opportunities

```text
Phase 2 parallel group:
  T006 ─┐
  T007 ─┤ (all type definitions + constants + output)
  T008 ─┤
  T009 ─┤
  T010 ─┘
  Then: T011, T012, T013 (sequential — session → http → CLI entry)

Phase 3 parallel group A (login modes):
  T014 ─┐
  T015 ─┤ (three login implementations)
  T016 ─┘
  Then: T017 (dispatcher)

Phase 3 parallel group B (other auth commands):
  T018 ─┐
  T019 ─┤ (export, status, logout)
  T020 ─┘
  Then: T021 (register commands)

Phase 5 parallel group (tests + docs):
  T024 ─┐
  T025 ─┤
  T026 ─┤ (fixtures + unit tests + skill file + npm scripts)
  T027 ─┤
  T028 ─┤
  T032 ─┤
  T033 ─┘
  Then: T029, T030, T031 (integration tests, sequential)
  Then: T034 (quickstart validation)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T013)
3. Complete Phase 3: User Story 1 — Auth (T014–T021)
4. **STOP and VALIDATE**: `dubsado auth login` → `dubsado auth status` → `dubsado auth logout`
5. This is a deployable MVP — auth works end-to-end

### Incremental Delivery

1. Setup + Foundational → Project compiles, CLI skeleton works
2. Add User Story 1 → Auth works → **MVP!**
3. Add User Story 2 → First data command works → end-to-end proof
4. Add Polish → Tests pass, skill file ready, quickstart validated
5. Each increment adds value without breaking previous functionality

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [US1]/[US2] labels map to spec.md user stories for traceability
- R7 (headless login endpoint) needs implementation-time verification from browser DevTools — see research.md
- CSRF UUID extraction: URL-decode the `csrf` cookie value, strip `s%3A` prefix, take substring before the `.` separator
- The skill file (T032) is a first-class deliverable per the constitution (Principle II)
- Commit after each task or logical group
