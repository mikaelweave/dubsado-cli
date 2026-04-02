# Research: Auth Login & User Read

**Feature**: 001-auth-login-user-read
**Date**: 2026-04-02
**Status**: Complete

## Research Tasks

### R1: Dubsado Authentication Mechanism

**Context**: Dubsado has no public API. Need to determine how to authenticate CLI requests.

**Decision**: Three-mode authentication — browser login (Playwright), session import/export, headless credential POST. **Targets v2 API** (`hello.dubsado.com`) which requires only a JWT `token` cookie for authenticated GET requests.

**Rationale**: Testing (see [research-api-auth.md](research-api-auth.md)) revealed two Dubsado API versions. The v3 API (`app.dubsado.com`) enforces global CSRF middleware requiring signed cookie+header pairs. The v2 API (`hello.dubsado.com`) accepts just a JWT `token` cookie for GET requests with no CSRF. This dramatically simplifies the auth model. The Zapier API token still cannot be used directly.

**Alternatives considered**:

- Zapier API token: Tested 12+ authentication patterns across multiple endpoint paths. All returned 403 CSRF error. Token appears to be webhook-only, not usable for direct API calls.
- OAuth2/OIDC: Not available — Dubsado has no OAuth provider.
- Local HTTP proxy: Would intercept browser traffic. Invasive, fragile, poor UX.
- Manual cookie paste: Works but terrible UX, error-prone for LLM agents.

### R2: Session Cookie Structure

**Context**: Which cookies and headers are required for authenticated API requests?

**Decision**: Single JWT `token` cookie only (v2 API).

**Rationale**: The v2 API at `hello.dubsado.com` requires only `Cookie: token=<JWT>` for authenticated GET requests. No CSRF cookie, no CSRF header, no `x-brand` header. The JWT contains `_id`, `email`, `activeBrand`, `exp` (3-day TTL), and `verificationState`. This is a dramatic simplification from v3 which required 4 cookies + 2 headers.

**v3 (deprecated for CLI)**: Required `session`, `csrf`, `publicSiteToken`, `sessionExpiry` cookies + `x-csrf-token` + `x-brand` headers.

### R3: User Profile Endpoint

**Context**: Need a simple read-only endpoint to verify auth works.

**Decision**: `GET /api/users/self` (v2 API at `hello.dubsado.com`)

**Rationale**: Confirmed via curl testing against v2 API. Returns user profile JSON wrapped in `{user: ...}` with fields: `_id`, `email`, `contact.firstName`, `contact.lastName`, `locale`, `isLocked`, `isSoftLocked`, `isUnverified`, `createdAt` (plain ISO string, not `{$date: ...}`). Dates are plain ISO 8601 strings on v2 (v3 used MongoDB extended JSON `{$date: "..."}`). The v2 response includes an embedded `business` object with brand details.

**Alternatives considered**: `/api/clients` also works on v2 but returns more complex data. `/api/users/self` is the simplest smoke test.

### R4: Playwright as Browser Automation Dependency

**Context**: Best technology for browser-based auth capture?

**Decision**: Playwright (`playwright-core` package, user installs browser separately via `npx playwright install chromium`)

**Rationale**: Playwright is the standard for browser automation in Node.js CLI tools. Same pattern used by `az login`, `gh auth login --web`. `playwright-core` is the lightweight package (~3MB) that doesn't auto-download browsers — users run `npx playwright install chromium` once. This keeps the installed CLI small and the browser download explicit.

**Alternatives considered**:

- Puppeteer: Similar capability but Playwright has better API for cookie extraction and browser context management.
- Full `playwright` package: Auto-downloads browsers (~100MB+ per browser). Too heavy for a CLI dependency. `playwright-core` + explicit install is better.

### R5: CLI Framework Choice

**Context**: Need a minimal CLI framework for command routing and flag parsing.

**Decision**: `commander`

**Rationale**: Constitution mandates minimal dependencies. `commander` is the most widely-used Node.js CLI framework, zero-config, no code generation. Supports nested subcommands (`dubsado auth login`), flag parsing, and help generation out of the box.

**Alternatives considered**:

- `yargs`: More features but larger surface area. YAGNI.
- `oclif`: Full CLI framework with code generation, plugins, etc. Overkill.
- `citty`/`cac`: Lighter but less ecosystem support.

### R6: Rate Limiting

**Context**: Does Dubsado rate-limit API requests?

**Decision**: Dubsado applies rate limiting: `ratelimit-policy: 30000;w=900` (30,000 requests per 15-minute window).

**Rationale**: Observed in response headers. Very generous for a CLI tool — unlikely to be hit during normal usage. No rate-limiting logic needed in v1; just log the rate limit headers for debugging.

### R7: Headless Login Endpoint

**Context**: For headless mode, what endpoint does Dubsado use for email/password login?

**Decision**: `POST /api/auth/login` — VERIFIED 2026-04-02

**Request body** (all fields required by the endpoint):

```json
{
  "email": "user@example.com",
  "password": "...",
  "deviceToken": "<JWT signed RS256>",
  "recaptchaToken": "<reCAPTCHA v3 token>"
}
```

**`deviceToken`** — A JWT (RS256-signed) with payload:

```json
{
  "user": "<mongodb_user_id>",
  "uniqueDeviceId": "<uuid-v4>",
  "exp": <epoch>,
  "iat": <epoch>
}
```

The private key used for signing is embedded in Dubsado's frontend JavaScript. The token represents a "remembered device" for MFA bypass.

**`recaptchaToken`** — A Google reCAPTCHA v3 token generated client-side. Requires a reCAPTCHA site key embedded in Dubsado's frontend.

**Implications for headless mode**:

- Both `deviceToken` and `recaptchaToken` present anti-automation challenges
- `recaptchaToken` cannot be generated without a browser or a reCAPTCHA solving service
- `deviceToken` requires the RS256 private key from Dubsado's frontend bundle
- **Recommendation**: Headless mode should attempt login without these fields first (they may be optional for non-2FA accounts). If that fails, fall back to a Playwright-driven headless browser that can generate both tokens via the actual frontend code.

**Response**: HTTP 200, sets session cookies via `Set-Cookie` headers.
