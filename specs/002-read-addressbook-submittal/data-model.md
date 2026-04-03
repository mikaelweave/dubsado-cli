# Data Model: Read Client & Form Entities

**Feature**: 002-read-addressbook-submittal
**Date**: 2026-04-02

## Entities

### Client

Represents a person or business in the user's Dubsado account.

**Source endpoint**: `GET /api/clients/search` (list), `GET /api/clients/<id>` (single)

**Clean output shape** (allowlist — only these fields are emitted):

| Field       | Type     | Source            | Notes                                    |
| ----------- | -------- | ----------------- | ---------------------------------------- |
| id          | string   | `_id`             | Dubsado MongoDB ObjectId                 |
| firstName   | string   | `firstName`       | Client's first name                      |
| lastName    | string   | `lastName`        | Client's last name                       |
| email       | string   | `email`           | Primary email address                    |
| phone       | string   | `phone`           | Phone number (may be empty)              |
| company     | string   | `company.name`    | Company name (may be empty/absent)       |
| tags        | string[] | `tags`            | Tags/labels (may be empty array)         |
| createdAt   | string   | `createdAt`       | ISO 8601 date string, normalized         |

> **Note**: `address` (object) is deferred from v1 — complex nested shape, omitted from the initial contract for simplicity.

**Fields excluded**: `hmac`, `churnkey`, `attribution`, internal IDs, `__v`, `accountId`, and any other internal/system fields discovered during implementation.

**Mapping strategy**: Allowlist — pick known fields from the raw response. Unknown fields are silently ignored.

**Wrapper handling**: Response may be wrapped in `{ clients: [...] }` or similar — unwrap during mapping (pattern TBD from fixture, same approach as `user me` unwrapping `{ user: ... }`).

---

### Form

Represents a form that a customer has submitted in Dubsado — questionnaires, intake forms, contracts, etc.

**Source endpoint**: `GET /api/forms/?populate=true` (list), `GET /api/forms/<id>?populate=true` (single)

**Clean output shape** (allowlist — only these fields are emitted):

| Field       | Type     | Source                                 | Notes                                                            |
| ----------- | -------- | -------------------------------------- | ---------------------------------------------------------------- |
| id          | string   | `_id`                                  | Dubsado MongoDB ObjectId                                         |
| name        | string   | `name` or `title`                      | Form name/title — exact field TBD                                |
| type        | string   | `type` or `formType`                   | Form category (questionnaire, contract, etc.) — exact field TBD  |
| status      | string   | `status`                               | Submission status (e.g., draft, sent, completed)                 |
| clientId    | string   | `client._id` or `client`               | Associated client ID (populated or bare)                         |
| clientName  | string   | `client.firstName + client.lastName`   | Populated client name (if available)                             |
| projectId   | string   | `projectId` or `job`                   | Associated project/job ID                                        |
| createdAt   | string   | `createdAt`                            | ISO 8601 date string, normalized                                 |
| updatedAt   | string   | `updatedAt`                            | ISO 8601 date string, normalized                                 |

**Fields excluded**: Internal fields, raw template data, rendering metadata, `__v`, etc.

**Mapping strategy**: Allowlist. Exact field names will be confirmed from recorded API fixture during implementation. The mapper will handle both populated references (`client: { _id, firstName, ... }`) and bare IDs (`client: "abc123"`).

**Note**: Several field names are marked "TBD" because the exact Dubsado API response shape for forms has not been captured as a fixture yet. The mapper will be finalized during implementation when the actual response is recorded. The type interface will define the clean output shape; the mapper function will handle whatever the API returns.

## Relationships

```text
Client 1──* Form
  │
  └── A client can have zero or more form submissions
      A form always references one client (via clientId)
```

## Validation Rules

- `id`: Required, non-empty string
- `firstName`, `lastName`: Required for client, default to empty string if absent
- `email`: Required for client, default to empty string if absent
- `createdAt`, `updatedAt`: Normalize to ISO 8601 string; handle both `{ $date: "..." }` (v3-style) and plain string (v2-style) formats
- All optional fields: Default to empty string or empty array as appropriate; never emit `null` or `undefined`

## State Transitions

N/A — all entities are read-only in this feature. No state changes.
