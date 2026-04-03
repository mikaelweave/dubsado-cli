# Tasks: Read Client & Form Entities

**Input**: Design documents from `/specs/002-read-addressbook-submittal/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/cli-commands.md

**Tests**: Included — plan.md specifies unit tests for mappers and integration tests for commands, following the same pattern as feature 001.

**Organization**: Tasks grouped by user story. US1+US3 (list commands) are P1/MVP; US2+US4 (get commands) are P2 enhancements.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths included in all descriptions

---

## Phase 1: Shared Types & Fixtures

**Purpose**: Define TypeScript interfaces for both entities and record API fixtures. No commands yet — just the types and test data that all stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 [P] Define Client interface in src/types/client.ts per data-model.md: id, firstName, lastName, email, phone, company, tags (string[]), createdAt — all strings except tags
- [X] T002 [P] Define Form interface in src/types/form.ts per data-model.md: id, name, type, status, clientId, clientName, projectId, createdAt, updatedAt — all strings
- [X] T003 Re-export Client and Form types from src/types/index.ts (add to existing exports)
- [X] T004 [P] Record API fixture: call `GET /api/clients/search?count=50&page=1&sort=firstName&filter={"search":""}&custom={"select":"_id firstName lastName email address company phone"}` with a valid session, save response to tests/fixtures/client-list-200.json
- [X] T005 [P] Record API fixture: call `GET /api/clients/<known-id>` with a valid session, save response to tests/fixtures/client-get-200.json
- [X] T006 [P] Record API fixture: call `GET /api/forms/?populate=true` with a valid session, save response to tests/fixtures/form-list-200.json
- [X] T007 [P] Record API fixture: call `GET /api/forms/<known-id>?populate=true` with a valid session, save response to tests/fixtures/form-get-200.json

**Checkpoint**: Types compile with `tsc --noEmit`. Fixture files contain actual Dubsado API responses.

---

## Phase 2: User Story 1 — List Clients (Priority: P1) 🎯 MVP

**Goal**: `dubsado client list` retrieves clients via the search endpoint and outputs a clean JSON array.

**Independent Test**: Run `dubsado client list` with a valid session and verify JSON output has an array of client objects with expected fields.

### Implementation for User Story 1

- [X] T008 [US1] Implement client list command in src/cli/client/list.ts: call authenticatedFetch with `/api/clients/search?count=50&page=1&sort=firstName&filter={"search":""}&custom={"select":"_id+firstName+lastName+email+address+company+phone","filterFields":["firstName","lastName","email","company.name","phone"],"search":""}`, export mapClient() function that maps raw response to Client interface (allowlist: \_id→id, firstName, lastName, email, phone, company.name→company, tags or [], normalize createdAt), unwrap response wrapper (inspect fixture to determine if array is at root or under a key like `clients`), map each item, wrap in output envelope
- [X] T009 [US1] Register client subcommand group in src/cli/index.ts: create `client` command group with description "Client commands", add list subcommand from src/cli/client/list.ts

### Tests for User Story 1

- [X] T010 [P] [US1] Write unit tests in tests/unit/client-list.test.ts: test mapClient() with fixture data — verify field mapping, missing field defaults, date normalization, unknown fields are stripped
- [X] T011 [P] [US1] Write integration tests in tests/integration/client-list.test.ts: test full command with mocked fetch — success (200 with fixture), empty list, auth error (401), API error (500)

**Checkpoint**: `dubsado client list` returns `{ ok: true, data: [...] }` with clean client objects. `npm test` passes for client-list tests.

---

## Phase 3: User Story 2 — Read a Single Client (Priority: P2)

**Goal**: `dubsado client get <id>` retrieves one client by ID.

**Independent Test**: Run `dubsado client get <known-id>` and verify output has the correct client.

### Implementation for User Story 2

- [X] T012 [US2] Implement client get command in src/cli/client/get.ts: accept `<id>` required argument, call authenticatedFetch(`/api/clients/${id}`), reuse mapClient() from src/cli/client/list.ts (export it), unwrap single-object response, wrap in output envelope, handle 404 as `Dubsado API returned HTTP 404.`
- [X] T013 [US2] Register client get subcommand in src/cli/index.ts: add get subcommand under the `client` command group

### Tests for User Story 2

- [X] T014 [P] [US2] Write unit tests in tests/unit/client-get.test.ts: test mapClient() with single-object fixture — same mapper, different wrapper handling
- [X] T015 [P] [US2] Write integration tests in tests/integration/client-get.test.ts: test full command — success (200), missing ID argument error, 404 not found, auth error

**Checkpoint**: `dubsado client get <id>` returns `{ ok: true, data: { ... } }`. Both client commands work.

---

## Phase 4: User Story 3 — List Forms (Priority: P1) 🎯 MVP

**Goal**: `dubsado form list` retrieves forms via the forms endpoint with population.

**Independent Test**: Run `dubsado form list` with a valid session and verify JSON output has an array of form objects.

### Implementation for User Story 3

- [X] T016 [US3] Implement form list command in src/cli/form/list.ts: call authenticatedFetch('/api/forms/?populate=true'), export mapForm() function that maps raw response to Form interface (allowlist: \_id→id, name/title→name, type/formType→type, status, handle populated client object vs bare ID for clientId/clientName, projectId/job→projectId, normalize createdAt/updatedAt), unwrap response wrapper (inspect fixture), map each item, wrap in output envelope
- [X] T017 [US3] Register form subcommand group in src/cli/index.ts: create `form` command group with description "Form commands", add list subcommand from src/cli/form/list.ts

### Tests for User Story 3

- [X] T018 [P] [US3] Write unit tests in tests/unit/form-list.test.ts: test mapForm() with fixture data — field mapping, populated client handling, bare ID fallback, date normalization, unknown field stripping
- [X] T019 [P] [US3] Write integration tests in tests/integration/form-list.test.ts: test full command — success (200 with fixture), empty list, auth error, API error

**Checkpoint**: `dubsado form list` returns `{ ok: true, data: [...] }` with clean form objects. `npm test` passes for form-list tests.

---

## Phase 5: User Story 4 — Read a Single Form (Priority: P2)

**Goal**: `dubsado form get <id>` retrieves one form by ID with population.

**Independent Test**: Run `dubsado form get <known-id>` and verify output has the correct form.

### Implementation for User Story 4

- [X] T020 [US4] Implement form get command in src/cli/form/get.ts: accept `<id>` required argument, call authenticatedFetch(`/api/forms/${id}?populate=true`), reuse mapForm() from src/cli/form/list.ts, unwrap single-object response, wrap in output envelope, handle 404
- [X] T021 [US4] Register form get subcommand in src/cli/index.ts: add get subcommand under the `form` command group

### Tests for User Story 4

- [X] T022 [P] [US4] Write unit tests in tests/unit/form-get.test.ts: test mapForm() with single-object fixture
- [X] T023 [P] [US4] Write integration tests in tests/integration/form-get.test.ts: test full command — success, missing ID argument, 404, auth error

**Checkpoint**: `dubsado form get <id>` returns `{ ok: true, data: { ... } }`. All 4 commands work.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Update skill file, validate end-to-end, ensure all tests and lint pass.

- [X] T024 [P] Update skills/dubsado.md: add command reference for `client list`, `client get`, `form list`, `form get` with flags, example invocations, and output shapes per contracts/cli-commands.md
- [X] T025 Run full test suite: `npm test && npm run lint` — all existing + new tests must pass
- [X] T026 Run quickstart.md validation: walk through `dubsado client list` → `dubsado client get <id>` → `dubsado form list` → `dubsado form get <id>` end-to-end with a live session

**Checkpoint**: `npm test` passes, `npm run lint` passes, skill file updated, quickstart validated.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Types & Fixtures)**: No dependencies — start immediately
- **Phase 2 (US1: Client List)**: Depends on T001, T003, T004
- **Phase 3 (US2: Client Get)**: Depends on T008 (reuses mapClient from client list)
- **Phase 4 (US3: Form List)**: Depends on T002, T003, T006 — **can run in parallel with Phase 2**
- **Phase 5 (US4: Form Get)**: Depends on T016 (reuses mapForm from form list)
- **Phase 6 (Polish)**: Depends on all previous phases

### Parallel Opportunities

```text
Phase 1 parallel group (types + fixtures):
  T001 ─┐
  T002 ─┤ (type definitions — different files)
  T004 ─┤
  T005 ─┤ (fixture recording — independent API calls)
  T006 ─┤
  T007 ─┘
  Then: T003 (re-export — depends on T001, T002)

Phase 2+4 parallel group (list commands — independent entities):
  T008 (client list) ─┐
  T016 (form list)   ─┘ (different directories, no shared code)

Phase 3+5 parallel group (get commands — after their list counterparts):
  T012 (client get) ─┐
  T020 (form get)   ─┘ (different directories, reuse respective mappers)

Test parallel group (after implementation):
  T010 ─┐
  T011 ─┤
  T014 ─┤
  T015 ─┤ (all test files — independent)
  T018 ─┤
  T019 ─┤
  T022 ─┤
  T023 ─┘

Then: T024, T025, T026 (polish — sequential)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 3 — List Commands)

1. Complete Phase 1: Types & Fixtures (T001–T007)
2. Complete Phase 2: Client List (T008–T011) and Phase 4: Form List (T016–T019) **in parallel**
3. **STOP and VALIDATE**: `dubsado client list` + `dubsado form list` both work
4. This is a deployable MVP — list commands for both entities work

### Incremental Delivery

1. Types + Fixtures → Clean interfaces, real test data
2. Add Client List + Form List → **MVP!** Both list commands work
3. Add Client Get + Form Get → Detail lookups work
4. Add Polish → Skill file updated, all tests pass, quickstart validated

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [US1–US4] labels map to spec.md user stories for traceability
- T004–T007 (fixture recording) require a live authenticated session — must be done manually or via `dubsado auth login` first
- Mapper field names are provisional for forms — finalize from fixtures in T006/T007
- mapClient() is defined in list.ts and reused by get.ts — export it
- mapForm() is defined in list.ts and reused by get.ts — same pattern
- Commit after each task or logical group
