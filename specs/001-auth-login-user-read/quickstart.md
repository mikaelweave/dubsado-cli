# Quickstart: Dubsado CLI

## Prerequisites

- Node.js 20+ (LTS)
- A Dubsado account

## Install

```bash
npm install -g dubsado-cli
```

## Install Playwright Browser (one-time, for browser login mode)

```bash
npx playwright install chromium
```

## Authenticate

### Option A: Browser login (recommended for humans)

```bash
dubsado auth login
```

A browser window opens to Dubsado's v2 login page. Log in as normal. The CLI captures your JWT token automatically.

### Option B: Import from another machine

On the machine where you already logged in:

```bash
dubsado auth export
# Prints: { "ok": true, "data": { "blob": "eyJ2ZXJz..." } }
```

On the target machine:

```bash
dubsado auth login --import eyJ2ZXJz...
```

### Option C: Headless (for bots / CI)

```bash
export DUBSADO_EMAIL="bot@example.com"
export DUBSADO_PASSWORD="your-password"
dubsado auth login --headless
```

Or inline:

```bash
dubsado auth login --headless --email bot@example.com --password your-password
```

## Verify

```bash
dubsado auth status
dubsado user me
```

## Example Output

```bash
$ dubsado user me
{"ok":true,"data":{"id":"69ce8d50...","email":"mikael@mikael.dev","firstName":"Mikael","lastName":"Weaver","locale":"en-us","isLocked":false,"isSoftLocked":false,"isUnverified":false,"createdAt":"2026-04-02T15:37:52.247Z"}}

$ dubsado user me --pretty
{
  "ok": true,
  "data": {
    "id": "69ce8d50...",
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

## Logout

```bash
dubsado auth logout
```
