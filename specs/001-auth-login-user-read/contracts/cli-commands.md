# CLI Command Contracts: Auth Login & User Read

**Feature**: 001-auth-login-user-read
**Date**: 2026-04-02

This document defines the public CLI interface for all commands in this feature. These contracts are the source of truth for the companion skill file.

---

## dubsado auth login

Authenticate with Dubsado. Supports three modes.

### Browser mode (default)

```bash
dubsado auth login [--timeout <seconds>]
```

Opens a Chromium browser to `https://hello.dubsado.com/user/login`. User logs in via Dubsado's UI. CLI captures the JWT `token` cookie after login completes.

**Flags**:

- `--timeout <seconds>` — Max wait time for login completion (default: 300)

**Exit codes**: 0 = success, 1 = error/cancelled/timeout

**Stdout** (success):

```json
{ "ok": true, "data": { "email": "user@example.com", "brandId": "..." } }
```

**Stdout** (failure):

```json
{ "ok": false, "error": "Login cancelled — browser was closed before authentication completed." }
```

### Import mode

```bash
dubsado auth login --import <base64-blob>
echo "<base64-blob>" | dubsado auth login --import -
```

Imports a session blob previously produced by `dubsado auth export`.

**Flags**:

- `--import <blob>` — Base64-encoded session blob. Use `-` to read from stdin.

**Exit codes**: 0 = success, 1 = invalid/expired blob

### Headless mode

```bash
dubsado auth login --headless --email <email> --password <password>
dubsado auth login --headless  # reads DUBSADO_EMAIL / DUBSADO_PASSWORD env vars
```

POSTs credentials directly to Dubsado's login endpoint. For dedicated bot accounts.

**Flags**:

- `--headless` — Enable headless credential login
- `--email <email>` — Dubsado account email (or `DUBSADO_EMAIL` env var)
- `--password <password>` — Dubsado account password (or `DUBSADO_PASSWORD` env var)

**Precedence**: Flags > environment variables.

**Exit codes**: 0 = success, 1 = invalid credentials or missing arguments

---

## dubsado auth export

Print the current session as a portable base64-encoded blob.

```bash
dubsado auth export
```

**Exit codes**: 0 = success, 1 = no active session

**Stdout** (success):

```json
{ "ok": true, "data": { "blob": "eyJ2ZXJzaW9uIjoxLC..." } }
```

---

## dubsado auth status

Check whether the stored session is still valid.

```bash
dubsado auth status
```

Makes a lightweight authenticated request to Dubsado to verify the session.

**Exit codes**: 0 = valid session, 1 = no session or expired

**Stdout** (valid):

```json
{ "ok": true, "data": { "authenticated": true, "email": "user@example.com", "capturedAt": "2026-04-02T15:37:52Z" } }
```

**Stdout** (expired):

```json
{ "ok": false, "error": "Session expired. Run 'dubsado auth login' to re-authenticate." }
```

---

## dubsado auth logout

Delete the stored session file.

```bash
dubsado auth logout
```

**Exit codes**: 0 = success (even if no session existed)

**Stdout**:

```json
{ "ok": true, "data": {} }
```

---

## dubsado user me

Retrieve the currently authenticated user's profile.

```bash
dubsado user me
```

Calls `GET /api/users/self` (v2 API at `hello.dubsado.com`) and maps the response to a clean output shape. The v2 response wraps the user in `{user: ...}`.

**Exit codes**: 0 = success, 1 = not authenticated or expired session

**Stdout** (success):

```json
{
  "ok": true,
  "data": {
    "id": "69ce8d50920cc40b63fb7d1f",
    "email": "mikael@mikael.dev",
    "firstName": "Mikael",
    "lastName": "Weaver",
    "locale": "en-us",
    "isLocked": false,
    "isSoftLocked": false,
    "isUnverified": false,
    "createdAt": "2026-04-02T15:37:52.247Z"
  }
}
```

**Stdout** (not authenticated):

```json
{ "ok": false, "error": "Not authenticated. Run 'dubsado auth login' first." }
```

---

## Global Flags

All commands support:

- `--pretty` — Format JSON output with indentation for human readability
- `--help` — Print command usage
