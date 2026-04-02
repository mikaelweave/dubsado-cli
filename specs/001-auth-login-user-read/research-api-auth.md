# Dubsado API Authentication Investigation

**Date**: 2026-04-02
**Feature**: 001-auth-login-user-read
**Purpose**: Document findings from reverse-engineering Dubsado's authentication model to determine the best CLI auth strategy.

## Executive Summary

Dubsado has **no public REST API** but has two internal API versions. The **v3 API** at `https://app.dubsado.com/api/*` enforces a global CSRF middleware that rejects requests missing signed cookie+header pairs. The **v2 API** at `https://hello.dubsado.com/api/*` uses a simpler model: a single JWT `token` cookie is sufficient for authenticated GET requests — **no CSRF tokens, no brand headers**.

**Recommendation**: Use the **v2 API** (`hello.dubsado.com`). Session management reduces to storing one JWT string (3-day TTL). Browser-based login via Playwright captures the `token` cookie. All tested v2 endpoints (`/api/users/self`, `/api/clients`, `/api/brands`, `/api/invoices`, `/api/workflows`, `/api/forms`, `/api/templates`, `/api/teams/`) work with just `Cookie: token=<JWT>`.

---

## 1. Browser Session Analysis

Captured HTTP headers from an authenticated browser session reveal the auth surface:

### Required Cookies
| Cookie | Purpose |
|--------|---------|
| `session` | Signed Express session cookie (primary auth identity) |
| `csrf` | Signed CSRF token cookie (e.g. `s%3A<uuid>.<signature>`) |
| `publicSiteToken` | Secondary session identifier tied to the account |
| `sessionExpiry` | Account ID or session expiry marker |

### Required Headers
| Header | Purpose |
|--------|---------|
| `x-csrf-token` | CSRF token value (must match the `csrf` cookie's inner UUID) |
| `x-brand` | Account/brand ID (identifies which Dubsado account) |

### Session Characteristics
- Sessions are created via Dubsado's login page (SPA with XHR POST)
- Session lifetime is unknown but finite (idle timeout suspected)
- No OAuth2, no redirect-based auth flow, no API key header — purely cookie-based
- All API responses are JSON under `/api/*`

---

## 2. Zapier Integration Token Investigation

Dubsado offers a Zapier integration with user-generated API tokens:
- **Location**: Dubsado Settings → Integrations → Zapier → "Generate new token"
- **Token format**: 40-character hex string (e.g. `eb5a971abc3d617f896882393057bab7d351c8c4`)
- **Zapier app name**: `DubsadoCLIAPI@1.5.0`
- **Help doc**: https://help.dubsado.com/en/articles/909872-connecting-with-zapier

### Zapier Capabilities (from docs)
**Triggers** (Dubsado → Zapier, push model):
- New Project as Lead
- New Project as Job
- New Payment Received
- Contract Signed
- Project Status Updated

**Actions** (Zapier → Dubsado):
- Create Project
- API Request (Beta) — "makes a raw HTTP request that includes this integration's authentication"

### Token Testing Results

Every test against `https://app.dubsado.com/api/*` returned the same CSRF error regardless of how the token was passed:

```
{"message":"Missing CSRF tokens.","error":{"name":"Forbidden"}}  (HTTP 403)
```

#### Methods Tested

| Method | Pattern | Result |
|--------|---------|--------|
| Bearer token | `Authorization: Bearer <token>` | 403 CSRF |
| Query param | `?apiToken=<token>` | 403 CSRF (or timeout on some paths) |
| Custom header | `X-Api-Token: <token>` | 403 CSRF |
| Custom header | `x-api-key: <token>` | timeout / 403 CSRF |
| As CSRF token | `x-csrf-token: <token>` | 403 CSRF |
| As CSRF cookie + header | cookie `csrf=<token>` + header `x-csrf-token: <token>` | 403 CSRF |
| As session cookie | cookie `session=s%3A<token>.placeholder` | 403 CSRF |
| POST body | `{"apiToken":"<token>"}` to various paths | 403 CSRF |

#### Paths Tested

| Path | HTTP Code | Notes |
|------|-----------|-------|
| `/api/project?limit=1` | 403 | Main browser endpoint — CSRF blocked |
| `/api/zapier/me` | 403 | Exists (not 404) but CSRF blocked |
| `/api/zapier/projects` | 403 | Exists but CSRF blocked |
| `/api/zapier/auth/test` | 403 | CSRF blocked |
| `/api/zapier/triggers/new_lead_v2` | 403 | CSRF blocked |
| `/api/zapier/authentication/test` | 403 | CSRF blocked |
| `/api/v1/projects` | 404 | Does not exist |
| `/api/ext/projects` | 404 | Does not exist |
| `/api/external/projects` | 404 | Does not exist |
| `/api/cli/projects` | 404 | Does not exist |
| `/cliapi/projects` | 200 | Returns SPA HTML (frontend catch-all, not API) |
| `/zapier/me` | 200 | Returns SPA HTML (frontend catch-all) |
| `api.dubsado.com` | DNS fail | Subdomain does not exist |

#### CSRF Middleware Behavior
- Applied globally to ALL `/api/*` routes — no observed exceptions
- Blocks ALL HTTP methods including GET (unusual; most CSRF middlewares exempt GET)
- Returns `403` with `{"message":"Missing CSRF tokens.","error":{"name":"Forbidden"}}`
- Requires a **signed** `csrf` cookie (Express `cookie-parser` signed format: `s%3A<value>.<signature>`)
- A valid signed cookie can only be obtained from an authenticated Express session

### Conclusion on Zapier Token

The Zapier token **cannot be used for direct API access**. Zapier's integration with Dubsado most likely works via:

1. **Webhook push model**: Dubsado pushes event data to Zapier when triggers fire. The token identifies the subscription. Zapier never calls Dubsado's API.
2. **Server-side session exchange**: Zapier's backend exchanges the token for a full session (including CSRF cookies) server-side, then replays those cookies when the "API Request (Beta)" action is used. This exchange is not accessible to external callers.

---

## 3. Alternative Approaches Evaluated

| Approach | Feasibility | Notes |
|----------|-------------|-------|
| **Zapier API token** | ❌ Not viable | Token cannot bypass CSRF middleware |
| **Direct credential POST** | ⚠️ Possible but rejected | CLI would handle raw passwords — security concern |
| **Playwright browser login** | ✅ Recommended | User logs in via real browser; CLI captures cookies after login completes |
| **Local HTTP proxy** | ⚠️ Complex | Would intercept browser traffic; invasive and fragile |
| **Manual cookie paste** | ⚠️ Works but bad UX | User copies cookies from DevTools; error-prone |
| **OAuth2 / OIDC** | ❌ Not available | Dubsado has no OAuth provider |

---

## 4. Recommended Approach: Playwright Browser Login

### How It Works
1. User runs `dubsado auth login`
2. CLI launches a Chromium window (via Playwright) pointed at `https://app.dubsado.com`
3. User completes login through Dubsado's own UI (email/password, optionally 2FA)
4. CLI monitors the browser context for the appearance of the `session` cookie on `app.dubsado.com`
5. Once detected, CLI extracts all required cookies (`session`, `csrf`, `publicSiteToken`, `sessionExpiry`) plus page-accessible values (`x-brand` from localStorage or a known API call)
6. CLI persists these to `~/.config/dubsado-cli/session.json` (mode 0600)
7. Browser closes automatically
8. All subsequent CLI commands replay the stored cookies + headers

### Advantages
- User credentials never touch the CLI — all auth happens in Dubsado's own UI
- Works with 2FA if enabled (user completes it in the browser)
- Same pattern used by `az login`, `gh auth login --web`, `gcloud auth login`
- Playwright is a dev/runtime dependency, well-maintained, cross-platform

### Tradeoffs
- Playwright downloads Chromium (~100MB one-time)
- Requires a graphical environment (no headless SSH-only servers)
- Session will eventually expire; user must re-run `dubsado auth login`

### Cookie Extraction Strategy
```
Browser context → cookies for domain "app.dubsado.com":
  session     → the signed Express session
  csrf        → the signed CSRF token
  publicSiteToken → account identifier
  sessionExpiry   → session marker

Derived from initial authenticated request:
  x-csrf-token → inner value from csrf cookie (after URL-decoding and stripping signature)
  x-brand      → from response of first authenticated API call or from the browser's localStorage
```

---

## 5. Confirmed API Endpoints

### GET /api/user/self — Current User Profile

**Discovered**: 2026-04-02 (from browser network inspection)
**Auth required**: Yes (session cookies + CSRF)
**Purpose**: Returns the authenticated user's profile. This is the primary smoke-test endpoint for verifying the auth flow works end-to-end.

**Request**:
```
GET https://app.dubsado.com/api/user/self
Headers: session cookies, x-csrf-token, x-brand
```

**Response** (HTTP 200):
```json
{
    "_id": "69ce8d50920cc40b63fb7d1f",
    "email": "mikael@mikael.dev",
    "emailPreferences": {
        "fromBusiness": false
    },
    "isCelsius": false,
    "contact": {
        "firstName": "Mikael",
        "lastName": "Weaver"
    },
    "locale": "en-us",
    "paymentFailedAttempts": 0,
    "bccMe": false,
    "attribution": {
        "referrer_url": "https://www.dubsado.com/",
        "signup_page": "/user/signup"
    },
    "createdAt": {
        "$date": "2026-04-02T15:37:52.247Z"
    },
    "updatedAt": {
        "$date": "2026-04-02T15:37:52.247Z"
    },
    "isNewDashboard": true,
    "hmac": "...",
    "churnkey": "...",
    "isSoftLocked": false,
    "isLocked": false,
    "isUnverified": false
}
```

**Key fields for CLI output**:

| Field | Path | Notes |
|-------|------|-------|
| User ID | `_id` | MongoDB ObjectId |
| Email | `email` | Account email |
| First Name | `contact.firstName` | |
| Last Name | `contact.lastName` | |
| Locale | `locale` | e.g. `en-us` |
| Account Locked | `isLocked` | |
| Account Soft-Locked | `isSoftLocked` | |
| Unverified | `isUnverified` | |
| Created | `createdAt.$date` | ISO 8601 timestamp |

**Fields to exclude from CLI output** (sensitive/internal):
- `hmac` — internal signature, no user value
- `churnkey` — third-party analytics token
- `attribution` — internal tracking data

---

## 6. Dubsado v2 API Investigation (hello.dubsado.com)

**Date**: 2026-04-02
**Purpose**: Compare v2 (`hello.dubsado.com`) vs v3 (`app.dubsado.com`) auth requirements.

### Key Discovery: v2 GET requests need only the JWT `token` cookie — NO CSRF

The v2 API at `hello.dubsado.com` uses a drastically simpler auth model for read operations. A single JWT `token` cookie is sufficient — no CSRF cookie, no CSRF header, no `x-brand` header.

### v2 Auth Model

| Aspect | v2 (hello.dubsado.com) | v3 (app.dubsado.com) |
|--------|------------------------|----------------------|
| **GET auth** | JWT `token` cookie only | JWT + `_csrf` cookie + `csrf-token` header |
| **POST auth** | JWT + CSRF (confirmed for `/api/auth/login`) | JWT + CSRF + deviceToken + reCAPTCHA |
| **User endpoint** | `GET /api/users/self` | `GET /api/user/self` |
| **Login page** | `/user/login` (AngularJS SPA) | `/` (React SPA) |
| **Zapier endpoints** | Returns "Invalid API key" (actually processes key) | Returns 403 CSRF (blocks before checking key) |
| **API key usable?** | No (key unrecognized, may need regeneration on v2) | No (CSRF blocks all access) |

### JWT Token Details

The `token` cookie is a standard HS256 JWT:

```json
{
  "_id": "69ce8d50920cc40b63fb7d1f",
  "email": "mikael@mikael.dev",
  "activeBrand": "69ce8d50920cc40b63fb7d32",
  "exp": 1775416126,
  "verificationState": {
    "isSoftLocked": false,
    "isLocked": false,
    "isUnverified": false
  },
  "iat": 1775156926
}
```

- **TTL**: 3 days (72 hours) from issuance
- **Contains**: userId, email, activeBrand — enough to identify the user
- **Cross-platform**: Same JWT works on both v2 and v3

### v2 Working Endpoints (confirmed with just `Cookie: token=<JWT>`)

| Endpoint | HTTP | Response |
|----------|------|----------|
| `GET /api/users/self` | 200 | `{user: {_id, email, contact, business, ...}}` |
| `GET /api/users` | 200 | Array of users |
| `GET /api/clients` | 200 | Array of clients with portal, social, contact info |
| `GET /api/brands` | 200 | Array of brands/businesses with colors, templates |
| `GET /api/invoices` | 200 | Array of invoices |
| `GET /api/workflows` | 200 | Array of workflows |
| `GET /api/forms` | 200 | Array of forms |
| `GET /api/templates` | 200 | Array of proposal/contract templates |
| `GET /api/teams/` | 200 | Array of teams (trailing slash required) |

### v2 Endpoints That Return HTML (SPA fallthrough, not real API routes)

These paths are not registered API routes; the AngularJS SPA catch-all serves HTML:
- `/api/user/self`, `/api/user`, `/api/account`, `/api/projects/`, `/api/schedulers`, `/api/members`, `/api/settings`, `/api/users/me`, `/api/getStarted`

### v2 API Key Testing

The Zapier API key `eb5a971abc3d617f896882393057bab7d351c8c4` was tested:

| Method | v2 Result | v3 Result |
|--------|-----------|-----------|
| `Authorization: Bearer <key>` on `/api/zapier/me` | 401 "Invalid API key" | 403 CSRF |
| `Authorization: Bearer <key>` on `/api/zapier/clients` | 401 "Invalid API key" | 403 CSRF |
| `Authorization: Bearer <key>` on `/api/teams/` | 401 "Permission Denied" | 403 CSRF |
| `X-Api-Key: <key>` on `/api/zapier/me` | 401 "Permission Denied" | 403 CSRF |
| `?api_key=<key>` on `/api/zapier/me` | 401 "Permission Denied" | 403 CSRF |

**v2 Zapier endpoints actually validate the key** (returns "Invalid API key" rather than generic "Permission Denied"). The key may need to be regenerated from v2 Brand Settings, or it may be brand/version-specific.

### v2 `/api/users/self` Response Shape

```json
{
  "user": {
    "_id": "69ce8d50920cc40b63fb7d1f",
    "email": "mikael@mikael.dev",
    "contact": { "firstName": "Mikael", "lastName": "Weaver" },
    "locale": "en-us",
    "isCelsius": false,
    "bccMe": false,
    "isDeviceVerificationEnabled": true,
    "isNewDashboard": true,
    "calendar": [],
    "activeBrand": "69ce8d50920cc40b63fb7d32",
    "business": {
      "_id": "69ce8d50920cc40b63fb7d32",
      "name": "Mikael W Consultation",
      "clientsRemaining": 3,
      "logo": "https://res.cloudinary.com/...",
      "primaryColor": "#53C491",
      "locale": "en-us",
      "tzid": "America/Los_Angeles"
    },
    "createdAt": "2026-04-02T15:37:52.247Z",
    "updatedAt": "2026-04-02T19:08:46.743Z"
  }
}
```

Note: v2 wraps the response in `{user: ...}` and dates are ISO strings (not `{$date: ...}` like v3).

---

## 7. Recommendation: Switch to v2 API

### Why v2 is significantly better for CLI use

1. **No CSRF for reads**: The single biggest simplification. GET requests need only `Cookie: token=<JWT>`. No CSRF cookie/header dance.
2. **Simpler session model**: Store only the JWT string. No `_csrf`, no `publicSiteToken`, no `sessionExpiry`, no `x-brand` header.
3. **Import/export trivial**: Session = one JWT string. Can be piped, stored in env vars, etc.
4. **Same data available**: All the endpoints we need (`/api/users/self`, `/api/clients`, `/api/brands`, etc.) work on v2.
5. **Browser login still works**: Playwright opens `hello.dubsado.com/user/login`, captures `token` cookie after login.
6. **3-day token TTL**: Reasonable for CLI use. Re-login needed every 3 days.

### Impact on Current Implementation

| Component | Change Needed |
|-----------|--------------|
| `BASE_URL` | `https://app.dubsado.com` → `https://hello.dubsado.com` |
| Session storage | Remove CSRF fields; store only JWT `token` |
| HTTP client | Remove CSRF header/cookie handling; send only `Cookie: token=<JWT>` |
| User endpoint | `/api/user/self` → `/api/users/self` |
| Response parsing | v2 wraps in `{user: ...}`; dates are ISO strings |
| Browser login URL | `app.dubsado.com` → `hello.dubsado.com/user/login` |
| Headless login | Still complex (CSRF needed for POST); consider removing |
| Auth status check | Use `/api/users/self` as validation endpoint |

---

## 8. Open Questions

1. **Zapier API key on v2**: The key was rejected as "Invalid". Can the user regenerate it from v2 Brand Settings? If so, API key auth might work on v2 Zapier endpoints, providing an even simpler auth path (no browser needed at all).

2. **Token refresh**: Does the v2 JWT get refreshed on activity, or is the 3-day TTL fixed from issuance?

3. **Write operations on v2**: POST/PUT/DELETE likely still need CSRF. Needs testing when we add write commands.

4. **v2 long-term availability**: Dubsado has been migrating to v3 (`app.dubsado.com`). Will v2 be deprecated? For now, both run in parallel.
