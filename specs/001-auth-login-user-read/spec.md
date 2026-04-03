# Feature Specification: Auth Login & User Read

**Feature Branch**: `001-auth-login-user-read`
**Created**: 2026-04-02
**Status**: Draft
**Input**: User description: "Auth login and one basic read command (user profile) to prove the CLI end-to-end"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Authenticate with Dubsado (Priority: P1)

The CLI supports three authentication modes to cover local, remote, and agentic
environments:

**Mode 1 — Browser login (default)**: A developer or LLM agent runs
`dubsado auth login`. The CLI opens a Chromium browser window (via Playwright)
pointed at Dubsado's login page. The user logs in through Dubsado's own UI —
the CLI never sees credentials. Once the CLI detects the JWT `token` cookie, it
captures the value and persists to a local session file.

**Mode 2 — Session import**: For remote/headless machines where a browser is not
available, a user authenticates on a local machine first and exports the session.
On the remote machine, `dubsado auth login --import` reads a session blob from
stdin or argument and writes the session file. A corresponding `dubsado auth export`
command prints the current session as a portable base64-encoded blob.

**Mode 3 — Headless credential login**: For fully agentic environments (e.g.
Open Claw, CI pipelines), a dedicated bot Dubsado account is created. The CLI
accepts `--email`/`--password` flags or reads `DUBSADO_EMAIL`/`DUBSADO_PASSWORD`
environment variables, POSTs credentials directly to Dubsado's login endpoint,
and captures session cookies from the response. This mode is invoked via
`dubsado auth login --headless`.

**Why this priority**: Nothing else works without a valid session. This is the
foundation for every other command.

**Independent Test**: Run `dubsado auth login` (any mode), confirm a session file
is created on disk and that `dubsado auth status` succeeds.

**Acceptance Scenarios**:

*Browser mode (default):*
1. **Given** a user runs `dubsado auth login`, **When** the browser opens to Dubsado's login page and the user successfully logs in, **Then** the CLI captures the JWT token cookie, prints `{ "ok": true, "data": { "email": "...", "brandId": "..." } }` and creates a session file containing the JWT token.
2. **Given** a user runs `dubsado auth login`, **When** the browser opens but the user closes it without logging in, **Then** the CLI prints `{ "ok": false, "error": "Login cancelled — browser was closed before authentication completed." }` and exits with a non-zero code.
3. **Given** a user runs `dubsado auth login`, **When** the login times out (user does not complete login within a reasonable period), **Then** the CLI prints a timeout error and exits cleanly.

*Import mode:*
4. **Given** a user has a valid session on a local machine, **When** they run `dubsado auth export`, **Then** the CLI prints a base64-encoded session blob to stdout.
5. **Given** a user runs `dubsado auth login --import <blob>` on a remote machine, **When** the blob is a valid session, **Then** the CLI writes the session file and prints `{ "ok": true }`.
6. **Given** a user runs `dubsado auth login --import` with an invalid or expired blob, **Then** the CLI prints a clear error and exits with a non-zero code.

*Headless mode:*
7. **Given** a dedicated bot account exists, **When** the user runs `dubsado auth login --headless --email bot@example.com --password secret` (or sets env vars), **Then** the CLI POSTs credentials to Dubsado's login endpoint, captures session cookies, and writes the session file.
8. **Given** invalid credentials in headless mode, **When** the login fails, **Then** the CLI prints `{ "ok": false, "error": "..." }` and exits with a non-zero code.

*Shared:*
9. **Given** a user has previously logged in (any mode), **When** they run `dubsado auth status`, **Then** the CLI reports whether the stored session is still valid.
10. **Given** a user wants to remove stored credentials, **When** they run `dubsado auth logout`, **Then** the CLI deletes the session file and prints `{ "ok": true }`.

---

### User Story 2 — Read Current User Profile (Priority: P2)

After authenticating, a developer or LLM agent runs `dubsado user me` to retrieve
the currently logged-in user's profile from Dubsado via `GET /api/users/self`
(v2 API at `hello.dubsado.com`). The CLI returns the user's ID, name, email,
locale, and account status as structured JSON. This serves as the simplest
possible proof that the auth flow works end-to-end and that the CLI can fetch
real data.

The response MUST include these fields from the Dubsado API response
(`response.user.*`): `_id`, `email`, `contact.firstName`, `contact.lastName`,
`locale`, `isLocked`, `isSoftLocked`, `isUnverified`, and `createdAt`.
Internal/sensitive fields (`hmac`, `churnkey`, `attribution`) MUST be excluded
from output.

**Why this priority**: This is the minimal "smoke test" for the entire CLI. It
validates auth, HTTP request replay, response parsing, and output formatting in
one shot.

**Independent Test**: After a successful `dubsado auth login`, run `dubsado user me`
and verify the output contains the expected user name/email.

**Acceptance Scenarios**:

1. **Given** a valid session exists, **When** the user runs `dubsado user me`, **Then** the CLI returns `{ "ok": true, "data": { "id": "...", "email": "...", "firstName": "...", "lastName": "...", "locale": "...", "isLocked": false, ... } }` with fields mapped from the Dubsado v2 `/api/users/self` response.
2. **Given** no session file exists, **When** the user runs `dubsado user me`, **Then** the CLI prints `{ "ok": false, "error": "Not authenticated. Run 'dubsado auth login' first." }` and exits with a non-zero code.
3. **Given** an expired session, **When** the user runs `dubsado user me`, **Then** the CLI prints `{ "ok": false, "error": "Session expired. Run 'dubsado auth login' to re-authenticate." }` and exits with a non-zero code.

---

### Edge Cases

- What happens when the session file exists but is corrupt or has invalid JSON? The CLI MUST treat it as "not authenticated" and prompt re-login.
- What happens when Dubsado's servers are unreachable? The CLI MUST return a clear network error in the standard JSON envelope, not an unhandled exception.
- What happens when Dubsado changes their login response shape? The CLI MUST detect unexpected responses and report a descriptive error rather than silently storing garbage.
- What happens when the session file has incorrect permissions (world-readable)? The CLI SHOULD warn the user about insecure file permissions on `auth status`.
- What happens when credentials contain special characters (unicode, symbols)? The user enters them directly in Dubsado's own login UI — no CLI-side encoding concerns.
- What happens when the account has 2FA enabled? The user completes 2FA in the browser as normal; the CLI only captures cookies after the entire login flow succeeds. (V1 assumes no 2FA; if the 2FA flow produces the expected cookies, it may work incidentally.)
- What happens when no browser is available (headless server, SSH session)? The default `dubsado auth login` MUST detect the headless environment and suggest using `--import` or `--headless` mode instead.
- What happens when `--headless` is used but no credentials are provided (no flags, no env vars)? The CLI MUST print a clear error listing the required flags or env vars.
- What happens when `dubsado auth export` is run with no active session? The CLI MUST print an error, not an empty blob.
- What happens when an imported session blob is from a different CLI version with an incompatible format? The CLI MUST detect format mismatches and report a clear error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: CLI MUST provide `dubsado auth login` with three modes:
  - **Browser (default)**: Opens a Playwright-driven Chromium browser to Dubsado's login page, waits for the user to complete authentication, and captures session cookies. The CLI does NOT handle credentials in this mode.
  - **Import (`--import`)**: Accepts a base64-encoded session blob (from `dubsado auth export`) via argument or stdin and writes it as the session file.
  - **Headless (`--headless`)**: Accepts `--email`/`--password` flags or `DUBSADO_EMAIL`/`DUBSADO_PASSWORD` environment variables, POSTs credentials directly to Dubsado's login endpoint, and captures session cookies from the response. Intended for dedicated bot accounts in agentic/CI environments.
- **FR-002**: CLI MUST persist the JWT `token` cookie value to a session file after successful login (any mode). The v2 API (`hello.dubsado.com`) requires only this token for authenticated GET requests — no CSRF tokens or brand headers.
- **FR-002a**: CLI MUST provide `dubsado auth export` that outputs the current session as a portable base64-encoded blob to stdout.
- **FR-003**: Session file MUST be stored at `~/.config/dubsado-cli/session.json` with file permissions restricted to the owning user (mode 0600).
- **FR-004**: CLI MUST provide `dubsado auth status` that reports whether a stored session is valid by making a lightweight authenticated request to Dubsado.
- **FR-005**: CLI MUST provide `dubsado auth logout` that deletes the session file.
- **FR-006**: CLI MUST provide `dubsado user me` that retrieves the current user's profile via `GET /api/users/self` (v2 API) using the stored JWT token and returns it as JSON. The v2 response wraps the user object in `{user: ...}`. Internal/sensitive fields (`hmac`, `churnkey`, `attribution`) MUST be stripped from output.
- **FR-007**: All commands MUST output JSON in the standard envelope `{ "ok": boolean, "data"?: object, "error"?: string }` to stdout.
- **FR-008**: All error diagnostics MUST go to stderr; stdout is exclusively for the JSON envelope.
- **FR-009**: When the CLI detects an expired or invalid session (HTTP 401 or login-redirect response), it MUST exit with a clear error message advising re-authentication — never silently retry.
- **FR-010**: Browser-based login MUST have a configurable timeout (default: 5 minutes) after which the CLI reports a timeout error and exits cleanly.
- **FR-012**: In headless mode, credentials MUST be accepted via `--email`/`--password` flags or `DUBSADO_EMAIL`/`DUBSADO_PASSWORD` environment variables. Flags take precedence over env vars. Credentials MUST NOT be persisted beyond the login request — only the resulting session cookies are stored.
- **FR-013**: In import mode, the session blob MUST include a version marker so the CLI can detect and reject incompatible formats from older/newer CLI versions.
- **FR-011**: CLI MUST support a `--pretty` flag on all commands for human-readable formatted output.

### Key Entities

- **Session**: The stored authentication state — contains the JWT `token` value and a timestamp of when the session was captured. Represents a single authenticated identity.
- **User Profile**: The Dubsado user account — contains name, email, brand/account identifier, and account-level settings. Represents the person who owns the Dubsado account.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from zero state to seeing their Dubsado user profile in under 60 seconds (login + user me).
- **SC-002**: After a successful login, subsequent commands authenticate without re-entering credentials for the lifetime of the Dubsado session.
- **SC-003**: An LLM agent on a local machine can trigger `dubsado auth login` (browser mode, human completes login), then use the persisted session for all subsequent read commands without needing access to credentials.
- **SC-003a**: An LLM agent on a remote/agentic machine can authenticate via `dubsado auth login --headless` using a dedicated bot account, or via `dubsado auth login --import` with a session blob, without requiring a browser.
- **SC-004**: All commands (`auth login`, `auth export`, `auth status`, `auth logout`, `user me`) return valid JSON parseable by any standard JSON parser in 100% of cases — including error scenarios.
- **SC-005**: Invalid credentials, expired sessions, and network errors all produce distinct, actionable error messages that a non-technical user or LLM can understand and act on.

## Clarifications

### Session 2026-04-02

- Q: Does Dubsado account have 2FA/MFA enabled, affecting the auth flow? → A: No 2FA — v1 scoped to non-2FA accounts only; 2FA handling deferred as future enhancement.
- Q: How should credentials be provided when an LLM agent drives the CLI? → A: Browser-based login — CLI opens a browser to Dubsado's login page, user authenticates there, CLI captures session cookies after successful login. LLM never has access to credentials.
- Q: How should the CLI capture cookies from the browser login? → A: Playwright (browser automation) — launch a Chromium window, user logs in via Dubsado's UI, CLI monitors cookies and extracts session state after login completes. Zapier API token was investigated but cannot bypass Dubsado's CSRF middleware (see research-api-auth.md).
- Q: How does auth work on remote/headless machines (SSH, CI, agentic tools like Open Claw)? → A: Three auth modes. (1) Browser (default, local). (2) Import — export session from a local machine, import on remote. (3) Headless — dedicated bot Dubsado account, CLI accepts email/password via flags or env vars and POSTs directly to the login endpoint.

## Assumptions

- Dubsado's v2 login page at `https://hello.dubsado.com/user/login` sets a JWT `token` cookie upon successful browser-based authentication.
- Dubsado's v2 API (`hello.dubsado.com`) requires only the JWT `token` cookie for authenticated GET requests — no CSRF token or brand header needed (see research-api-auth.md sections 6-7). The v3 API (`app.dubsado.com`) enforces global CSRF middleware, but v2 does not for reads.
- Two-factor authentication (2FA/MFA) is NOT enabled on the target account. V1 does not explicitly support 2FA flows; accounts with 2FA enabled are out of scope but may work incidentally since login completes in the browser. (Future enhancement.)
- Dubsado sessions expire after some period of inactivity; the exact duration is unknown but the CLI handles expiry gracefully.
- The user has a Dubsado account and can log in through the browser.
- In browser mode, the CLI never handles raw credentials — authentication is fully delegated to the browser. In headless mode, credentials are accepted for dedicated bot accounts and used only for the login request; they are not persisted.
- XDG base directory conventions are followed for config storage (`~/.config/`).
- The Dubsado API base URL is `https://hello.dubsado.com` (v2) and is not configurable in v1 (hardcoded).
- The user profile endpoint is confirmed at `GET /api/users/self` (v2 API, verified via curl — see research-api-auth.md section 6). The v2 response wraps the user in `{user: ...}` and uses plain ISO date strings.
- Only one session (one account) is stored at a time in v1.
