# Data Model: Auth Login & User Read

**Feature**: 001-auth-login-user-read
**Date**: 2026-04-02

## Entities

### Session

The stored authentication state persisted to `~/.config/dubsado-cli/session.json`.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `version` | `number` | Yes | Session format version (currently `1`). Used to detect incompatible imports. |
| `token` | `string` | Yes | JWT token value from the `token` cookie (v2 API at `hello.dubsado.com`). Contains userId, email, activeBrand, exp (3-day TTL). |
| `capturedAt` | `string` | Yes | ISO 8601 timestamp of when the session was captured |

**Validation rules**:

- All fields must be non-empty strings
- `version` must equal `1` (reject imports from different versions)
- `token` must be a non-empty string (JWT format)
- `capturedAt` must be a valid ISO 8601 date
- File permissions must be 0600 (warn if not)

**Note**: The v2 API requires only `Cookie: token=<JWT>` for authenticated GET requests. No CSRF tokens, no brand headers. The JWT itself contains the `activeBrand` claim.

**State transitions**: N/A — session is create-or-replace, not updated incrementally.

### UserProfile

The CLI's mapped representation of the Dubsado v2 `/api/users/self` response. The v2 API wraps the user in `{user: ...}`. Sensitive fields are stripped.

| Field | Type | Source (API path) | Description |
| --- | --- | --- | --- |
| `id` | `string` | `user._id` | MongoDB ObjectId |
| `email` | `string` | `user.email` | Account email |
| `firstName` | `string` | `user.contact.firstName` | User's first name |
| `lastName` | `string` | `user.contact.lastName` | User's last name |
| `locale` | `string` | `user.locale` | e.g. `en-us` |
| `isLocked` | `boolean` | `user.verificationState` or top-level | Account lock status |
| `isSoftLocked` | `boolean` | `user.verificationState` or top-level | Soft-lock status |
| `isUnverified` | `boolean` | `user.verificationState` or top-level | Email verification status |
| `createdAt` | `string` | `user.createdAt` | ISO 8601 (plain string on v2, not `{$date}`) |

**Excluded API fields** (not mapped to CLI output):

- `hmac` — internal signature
- `churnkey` — third-party analytics token
- `attribution` — internal tracking
- `emailPreferences` — not useful for CLI consumers
- `isCelsius` — UI preference
- `paymentFailedAttempts` — internal billing state
- `bccMe` — email setting
- `isNewDashboard` — UI state

### OutputEnvelope

The standard JSON response shape for all CLI commands.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ok` | `boolean` | Yes | `true` for success, `false` for error |
| `data` | `object \| undefined` | No | Present on success. Shape varies by command. |
| `error` | `string \| undefined` | No | Present on failure. Human-readable error message. |

**Invariants**:

- Exactly one of `data` or `error` is present (never both, never neither when `ok` is false)
- `ok: true` always includes `data` (even if `data` is `{}` for side-effect-only commands like `auth logout`)
- `ok: false` always includes `error`

## Relationships

```text
Session (1) ──persists to──> session.json (file)
Session (1) ──authenticates──> HTTP requests (Cookie: token=<JWT>)
UserProfile (1) ──mapped from──> GET /api/users/self response.user
OutputEnvelope (1) ──wraps──> UserProfile | Session status | error
```
