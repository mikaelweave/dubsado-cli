# CLI Command Contracts: Read Client & Form Entities

**Feature**: 002-read-addressbook-submittal
**Date**: 2026-04-02

## Commands

### `dubsado client list`

**Description**: List clients from the authenticated user's Dubsado account.

**Usage**:

```bash
dubsado client list
dubsado client list --pretty
```

**Options**: None (inherits `--pretty` from parent).

**API call**: `GET /api/clients/search?count=50&page=1&sort=firstName&filter={"search":""}&custom={"select":"_id firstName lastName email address company phone"}`

**Success output** (exit 0):

```json
{
  "ok": true,
  "data": [
    {
      "id": "69cee6a7c563610589bf24a2",
      "firstName": "Mikael",
      "lastName": "Weaver",
      "email": "mikael@mikael.dev",
      "phone": "",
      "company": "",
      "tags": [],
      "createdAt": "2026-04-02T12:00:00.000Z"
    }
  ]
}
```

**Error output** (exit 1):

```json
{ "ok": false, "error": "Not authenticated. Run 'dubsado auth login' first." }
```

```json
{ "ok": false, "error": "Dubsado API returned HTTP 500." }
```

---

### `dubsado client get <id>`

**Description**: Retrieve a single client by Dubsado ID.

**Usage**:

```bash
dubsado client get 69cee6a7c563610589bf24a2
dubsado client get 69cee6a7c563610589bf24a2 --pretty
```

**Arguments**:

- `<id>` (required): The Dubsado client ID.

**API call**: `GET /api/clients/<id>`

**Success output** (exit 0):

```json
{
  "ok": true,
  "data": {
    "id": "69cee6a7c563610589bf24a2",
    "firstName": "Mikael",
    "lastName": "Weaver",
    "email": "mikael@mikael.dev",
    "phone": "",
    "company": "",
    "tags": [],
    "createdAt": "2026-04-02T12:00:00.000Z"
  }
}
```

**Error output** (exit 1):

```json
{ "ok": false, "error": "Not authenticated. Run 'dubsado auth login' first." }
```

```json
{ "ok": false, "error": "Dubsado API returned HTTP 404." }
```

---

### `dubsado form list`

**Description**: List forms (customer submissions) from the authenticated user's Dubsado account.

**Usage**:

```bash
dubsado form list
dubsado form list --pretty
```

**Options**: None (inherits `--pretty` from parent).

**API call**: `GET /api/forms/?populate=true`

**Success output** (exit 0):

```json
{
  "ok": true,
  "data": [
    {
      "id": "6a1234567890abcdef000001",
      "name": "Client Questionnaire",
      "type": "questionnaire",
      "status": "completed",
      "clientId": "69cee6a7c563610589bf24a2",
      "clientName": "Mikael Weaver",
      "projectId": "6a1234567890abcdef000010",
      "createdAt": "2026-04-01T10:00:00.000Z",
      "updatedAt": "2026-04-02T14:30:00.000Z"
    }
  ]
}
```

**Error output** (exit 1):

```json
{ "ok": false, "error": "Not authenticated. Run 'dubsado auth login' first." }
```

```json
{ "ok": false, "error": "Dubsado API returned HTTP 500." }
```

---

### `dubsado form get <id>`

**Description**: Retrieve a single form by Dubsado ID.

**Usage**:

```bash
dubsado form get 6a1234567890abcdef000001
dubsado form get 6a1234567890abcdef000001 --pretty
```

**Arguments**:

- `<id>` (required): The Dubsado form ID.

**API call**: `GET /api/forms/<id>?populate=true`

**Success output** (exit 0):

```json
{
  "ok": true,
  "data": {
    "id": "6a1234567890abcdef000001",
    "name": "Client Questionnaire",
    "type": "questionnaire",
    "status": "completed",
    "clientId": "69cee6a7c563610589bf24a2",
    "clientName": "Mikael Weaver",
    "projectId": "6a1234567890abcdef000010",
    "createdAt": "2026-04-01T10:00:00.000Z",
    "updatedAt": "2026-04-02T14:30:00.000Z"
  }
}
```

**Error output** (exit 1):

```json
{ "ok": false, "error": "Not authenticated. Run 'dubsado auth login' first." }
```

```json
{ "ok": false, "error": "Dubsado API returned HTTP 404." }
```

## Common Error Envelope

All commands share the same error patterns:

| Condition | Error message | Exit code |
| --------- | ------------- | --------- |
| No session file | `Not authenticated. Run 'dubsado auth login' first.` | 1 |
| Expired session (401) | `Session expired. Run 'dubsado auth login' to re-authenticate.` | 1 |
| Login redirect | `Session expired. Run 'dubsado auth login' to re-authenticate.` | 1 |
| API error (non-401) | `Dubsado API returned HTTP <status>.` | 1 |
| Network error | `<native error message>` | 1 |

## Notes

- Output field names match Dubsado's terminology per project naming convention
- Exact form field names (`name`, `type`, `status`) are provisional — will be confirmed from recorded API fixtures during implementation
- The `address` field for clients is omitted from the initial contract for simplicity; it may be added as a nested object once the exact shape is known from fixtures
