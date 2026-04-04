# dubsado-cli

CLI wrapper for the [Dubsado](https://www.dubsado.com/) API — optimized for LLM consumption.

Every command outputs structured JSON to stdout: `{ "ok": true, "data": { ... } }` on success, `{ "ok": false, "error": "..." }` on failure. Errors and diagnostics go to stderr. Pipe output directly into `jq`, scripts, or LLM tool calls.

## Prerequisites

- **Node.js 20+**
- A **Dubsado account**

## Install

```bash
npm install -g @mikaelweave/dubsado-cli
```

If you plan to use browser-based login (the default), install Chromium once:

```bash
npx playwright install chromium
```

## Authenticate

You need to authenticate before running any data commands. Sessions are stored locally at `~/.config/dubsado-cli/session.json` and last approximately 3 days before needing renewal.

### Browser login (default)

```bash
dubsado auth login
```

A Chromium window opens to Dubsado's login page. Sign in as normal — the CLI captures your token automatically and closes the browser.

Use `--timeout <seconds>` to extend the default 5-minute wait (e.g. for 2FA):

```bash
dubsado auth login --timeout 600
```

### Import from another machine

Export a portable session blob from a machine that's already logged in:

```bash
dubsado auth export
# → { "ok": true, "data": { "blob": "eyJ2ZXJz..." } }
```

Then import it on the target machine:

```bash
dubsado auth login --import eyJ2ZXJz...
```

Or pipe it:

```bash
echo "eyJ2ZXJz..." | dubsado auth login --import -
```

### Headless (CI / bots)

Pass credentials directly or via environment variables:

```bash
# env vars
export DUBSADO_EMAIL="bot@example.com"
export DUBSADO_PASSWORD="your-password"
dubsado auth login --headless

# or inline
dubsado auth login --headless --email bot@example.com --password your-password
```

## Commands

### `dubsado auth status`

Check if your session is valid:

```bash
dubsado auth status
```

```json
{ "ok": true, "data": { "authenticated": true, "email": "you@example.com", "capturedAt": "2026-04-02T12:00:00.000Z" } }
```

### `dubsado auth logout`

Clear the local session:

```bash
dubsado auth logout
```

### `dubsado user me`

Fetch your Dubsado profile:

```bash
dubsado user me
```

```json
{
  "ok": true,
  "data": {
    "id": "69ce8d50...",
    "email": "you@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "locale": "en-us",
    "isLocked": false,
    "isSoftLocked": false,
    "isUnverified": false,
    "createdAt": "2026-04-02T15:37:52.247Z"
  }
}
```

### `dubsado client list`

List clients from your Dubsado account:

```bash
dubsado client list
```

```json
{
  "ok": true,
  "data": [
    {
      "id": "69cee6a7...",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@example.com",
      "phone": "555-123-4567",
      "company": "Doe Design Co",
      "tags": ["vip"],
      "createdAt": "2026-03-15T10:30:00.000Z"
    }
  ]
}
```

### `dubsado client get <id>`

Fetch a single client by ID:

```bash
dubsado client get 69cee6a7c563610589bf24a2
```

### `dubsado form list`

List forms (questionnaires, contracts, etc.):

```bash
dubsado form list
```

```json
{
  "ok": true,
  "data": [
    {
      "id": "6a123456...",
      "name": "Client Questionnaire",
      "type": "questionnaire",
      "status": "completed",
      "clientId": "69cee6a7...",
      "clientName": "Jane Doe",
      "projectId": "6a123456...",
      "createdAt": "2026-04-01T10:00:00.000Z",
      "updatedAt": "2026-04-02T14:30:00.000Z"
    }
  ]
}
```

### `dubsado form get <id>`

Fetch a single form by ID:

```bash
dubsado form get 6a1234567890abcdef000001
```

## Global Flags

| Flag        | Description                          |
| ----------- | ------------------------------------ |
| `--pretty`  | Format JSON output with indentation  |
| `--help`    | Show help for any command            |
| `--version` | Print the CLI version                |

## Exit Codes

| Code | Meaning                                                             |
| ---- | ------------------------------------------------------------------- |
| `0`  | Success                                                             |
| `1`  | Error (expired session, auth failure, network error, invalid input) |

## LLM Integration

This CLI ships with a skill file at `skills/dubsado.md` that describes all available commands and their output shapes. Point your LLM agent at this file so it knows how to call `dubsado` commands and parse the JSON responses.

## License

MIT
