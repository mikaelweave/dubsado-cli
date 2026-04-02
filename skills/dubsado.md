# Dubsado CLI — Command Reference

A CLI tool for interacting with the Dubsado v2 API (`hello.dubsado.com`). All commands output JSON to stdout in the format `{ "ok": boolean, "data"?: object, "error"?: string }`. Errors go to stderr. Use `--pretty` on any command for indented output.

Authentication uses a JWT `token` cookie — no CSRF tokens or additional headers needed for read operations.

## Authentication

### dubsado auth login

Authenticate with Dubsado. Three modes available.

**Browser mode (default):**

```bash
dubsado auth login
dubsado auth login --timeout 600
```

Opens a Chromium browser. Log in via Dubsado's UI. The CLI captures your session automatically.

**Import mode:**

```bash
dubsado auth login --import <base64-blob>
echo "<blob>" | dubsado auth login --import -
```

Import a session blob from `dubsado auth export`.

**Headless mode (for bots/CI):**

```bash
dubsado auth login --headless --email bot@example.com --password secret
dubsado auth login --headless  # uses DUBSADO_EMAIL / DUBSADO_PASSWORD env vars
```

### dubsado auth export

```bash
dubsado auth export
```

Output: `{ "ok": true, "data": { "blob": "eyJ2ZXJz..." } }`

### dubsado auth status

```bash
dubsado auth status
```

Output (valid): `{ "ok": true, "data": { "authenticated": true, "email": "...", "capturedAt": "..." } }`
Output (expired): `{ "ok": false, "error": "Session expired. Run 'dubsado auth login' to re-authenticate." }`

### dubsado auth logout

```bash
dubsado auth logout
```

Output: `{ "ok": true, "data": {} }`

Always exits 0, even if no session existed.

## User

### dubsado user me

```bash
dubsado user me
```

Returns the current user's profile.

Output:

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

## Exit Codes

- `0` — Success
- `1` — Error (auth failure, expired session, invalid input, network error)

## Global Flags

- `--pretty` — Format JSON output with indentation
- `--help` — Print command usage
- `--version` — Print CLI version
