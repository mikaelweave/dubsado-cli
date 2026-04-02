# Research: Read Client & Form Entities

**Feature**: 002-read-addressbook-submittal
**Date**: 2026-04-02
**Status**: Complete

## Research Tasks

### R1: Client Search Endpoint

**Context**: Need to determine the exact API endpoint, query parameters, and response shape for listing clients.

**Decision**: Use `GET /api/clients/search` with query parameters for pagination, filtering, field selection, and sorting.

**Rationale**: The user provided the actual Dubsado web app request. The search endpoint is what the Dubsado UI uses for the client list view. It supports pagination (`count`, `page`), sorting (`sort`), text search, and field selection via a `custom` JSON parameter.

**Known endpoint signature**:

```text
GET /api/clients/search
  ?count=50
  &page=1
  &sort=firstName
  &filter={"search":""}
  &custom={"select":"_id firstName lastName email address company phone","filterFields":["firstName","lastName","email","company.name","phone"],"search":""}
```

**Authentication**: `Cookie: token=<JWT>` only (v2 API, same as feature 001).

**Response shape**: Array of client objects. Exact fields TBD during implementation — will be discovered from recorded fixture. Known minimum fields from the `select` parameter: `_id`, `firstName`, `lastName`, `email`, `address`, `company`, `phone`.

**Alternatives considered**:

- `GET /api/clients/` (base endpoint): Simpler but lacks pagination and filtering. Not what the web UI uses. Could return unbounded results for large accounts.

### R2: Single Client Endpoint

**Context**: Need to determine how to fetch a single client by ID.

**Decision**: Use `GET /api/clients/<id>` — standard REST pattern for Dubsado's API.

**Rationale**: Dubsado follows conventional REST patterns. The client list endpoint path is `/api/clients/search` and creating a client POSTs to `/api/clients/`. By REST convention, a single resource is at `/api/clients/<id>`. This will be confirmed during implementation with a recorded fixture.

**Alternatives considered**: None — this is the standard pattern.

### R3: Forms Endpoint

**Context**: Need to determine the exact API endpoint and response shape for listing forms (customer submissions).

**Decision**: Use `GET /api/forms/?populate=true` to list all forms with populated data.

**Rationale**: The user confirmed this endpoint. The `populate=true` parameter expands related references (e.g., client info, form template details) inline rather than returning bare IDs. This gives richer data in a single request.

**Known endpoint signature**:

```text
GET /api/forms/?populate=true
```

**Authentication**: `Cookie: token=<JWT>` only (v2 API).

**Response shape**: TBD during implementation — will be discovered from recorded fixture. Expected to contain form metadata (type, name, status, dates) and populated client/project references.

**Filtering by client**: The endpoint also supports `?client=<id>` to filter forms for a specific client. Not in scope for v1 but noted for future enhancement.

### R4: Single Form Endpoint

**Context**: Need to determine how to fetch a single form by ID.

**Decision**: Use `GET /api/forms/<id>?populate=true` — standard REST pattern with population enabled.

**Rationale**: Same REST convention as clients. The population parameter ensures we get the same rich data shape as the list endpoint.

**Alternatives considered**: None — standard pattern.

### R5: Response Mapping Strategy

**Context**: How should raw API responses be mapped to clean CLI output shapes?

**Decision**: Follow the exact pattern from `user me` in feature 001: define a TypeScript interface for the clean shape, write a mapper function that extracts known fields and ignores/strips internal fields, export the mapper for unit testing.

**Rationale**: This pattern is already established and tested. The `mapUserProfile()` function in `src/cli/user/me.ts` demonstrates the approach: unwrap any wrapper object, extract specific fields by name, coerce types, normalize dates. The `EXCLUDED_FIELDS` set pattern may not be needed if we're cherry-picking fields (allowlist) rather than stripping fields (blocklist).

**Decision detail**: Use allowlist (pick known fields) rather than blocklist (strip known-bad fields). An allowlist is more resilient to API changes — new unknown fields are silently ignored rather than leaking through.

**Alternatives considered**:

- Blocklist (EXCLUDED_FIELDS pattern from user me): Works but fragile — new internal fields added by Dubsado would leak through until we add them to the set.
- Pass-through (no mapping): Violates Constitution Principle II (LLM-Optimized Output) — raw API shapes are unstable and contain internal clutter.
