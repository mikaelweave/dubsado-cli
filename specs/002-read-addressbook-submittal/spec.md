# Feature Specification: Read Client & Form Entities

**Feature Branch**: `002-read-addressbook-submittal`  
**Created**: 2026-04-02  
**Status**: Draft  
**Input**: User description: "Can you help me add more API endpoints? I want the ability to read the following entities: address book, and for submittal"

## Clarifications

### Session 2026-04-02

- Q: Should the CLI resource name be "addressbook", "client", or "contact"? → A: Use "client" — always match Dubsado's own terminology and API naming.
- Q: Should the CLI resource name be "submittal" or "form"? → A: Use "form" — matches Dubsado's API path `/api/forms/`.
- Q: Which client endpoint for `client list` — `/api/clients/` or `/api/clients/search`? → A: Use `/api/clients/search` — paginated, supports filtering and sorting.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — List Clients (Priority: P1)

A user or LLM agent runs `dubsado client list` to retrieve all clients from
their Dubsado account. The CLI calls the Dubsado v2 client search endpoint
(`/api/clients/search`) which supports pagination, filtering, and sorting. It
maps the response to a clean shape excluding internal/irrelevant fields, and
emits the list as a JSON envelope to stdout. The output is deterministic and
machine-readable, suitable for piping into downstream tools or LLM processing.

**Why this priority**: Clients are a foundational entity in Dubsado. Reading
clients is the most common secondary read operation after `user me` and enables
downstream workflows like filtering clients, auditing client data, and feeding
client lists to automation agents.

**Independent Test**: Can be fully tested by running `dubsado client list`
with a valid session and verifying the JSON output contains an array of client
objects with expected fields.

**Acceptance Scenarios**:

1. **Given** a valid authenticated session, **When** the user runs `dubsado client list`, **Then** the CLI outputs `{ ok: true, data: [...] }` with an array of client objects
2. **Given** a valid session, **When** the user runs `dubsado client list --pretty`, **Then** the output is formatted with indentation
3. **Given** an expired or missing session, **When** the user runs `dubsado client list`, **Then** the CLI outputs `{ ok: false, error: "..." }` and exits with code 1
4. **Given** a valid session but the API returns an empty list, **When** the user runs `dubsado client list`, **Then** the CLI outputs `{ ok: true, data: [] }`

---

### User Story 2 — Read a Single Client (Priority: P2)

A user or LLM agent runs `dubsado client get <id>` to retrieve a single
client by its Dubsado ID. This enables looking up specific clients for detail
views, feeding individual client data into templates or workflows, and verifying
client information.

**Why this priority**: Single-entity lookup is the natural complement to listing.
It enables agents to drill into a specific client after discovering them via the
list command.

**Independent Test**: Can be tested by running `dubsado client get <known-id>`
and verifying the output contains the correct client fields for that ID.

**Acceptance Scenarios**:

1. **Given** a valid session and a known client ID, **When** the user runs `dubsado client get <id>`, **Then** the CLI outputs `{ ok: true, data: { ... } }` with the client object
2. **Given** a valid session and a non-existent client ID, **When** the user runs `dubsado client get <bad-id>`, **Then** the CLI outputs an appropriate error
3. **Given** no arguments provided, **When** the user runs `dubsado client get`, **Then** the CLI shows a usage error indicating the ID argument is required

---

### User Story 3 — List Forms (Priority: P1)

A user or LLM agent runs `dubsado form list` to retrieve forms (customer
submissions) from Dubsado — such as questionnaires, intake forms, or contracts.
The CLI calls the Dubsado v2 forms endpoint with population enabled, maps the
response to a clean shape, and emits the list as a JSON envelope to stdout.

**Why this priority**: Forms are a core Dubsado entity that users and agents need
to access programmatically. Reading forms enables workflows like auditing client
responses, extracting form data for processing, and tracking submission status.

**Independent Test**: Can be tested by running `dubsado form list` with a valid
session and verifying the JSON output contains an array of form objects.

**Acceptance Scenarios**:

1. **Given** a valid authenticated session, **When** the user runs `dubsado form list`, **Then** the CLI outputs `{ ok: true, data: [...] }` with an array of form objects
2. **Given** a valid session, **When** the user runs `dubsado form list --pretty`, **Then** the output is formatted with indentation
3. **Given** an expired or missing session, **When** the user runs `dubsado form list`, **Then** the CLI outputs `{ ok: false, error: "..." }` and exits with code 1

---

### User Story 4 — Read a Single Form (Priority: P2)

A user or LLM agent runs `dubsado form get <id>` to retrieve a single form by
its Dubsado ID. This enables inspecting specific form responses, verifying
submitted data, or feeding form content into downstream processing.

**Why this priority**: Complements the list command by enabling detail lookups on
individual forms after discovery.

**Independent Test**: Can be tested by running `dubsado form get <known-id>` and
verifying output contains the correct form fields.

**Acceptance Scenarios**:

1. **Given** a valid session and a known form ID, **When** the user runs `dubsado form get <id>`, **Then** the CLI outputs `{ ok: true, data: { ... } }` with the form object
2. **Given** a valid session and a non-existent form ID, **When** the user runs `dubsado form get <bad-id>`, **Then** the CLI outputs an appropriate error

---

### Edge Cases

- What happens when the API returns a paginated response that exceeds a single page?
- How does the system handle clients or forms with missing or null fields?
- What happens if the v2 API response shape differs from expected (e.g., new fields added by Dubsado)?
- How does the system handle rate limiting responses (HTTP 429)?
- What happens when a client or form ID contains special characters?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a `client list` command that retrieves clients from the authenticated user's Dubsado account via the search endpoint (`/api/clients/search`)
- **FR-002**: System MUST provide a `client get <id>` command that retrieves a single client by Dubsado ID
- **FR-003**: System MUST provide a `form list` command that retrieves forms from the authenticated user's Dubsado account
- **FR-004**: System MUST provide a `form get <id>` command that retrieves a single form by Dubsado ID
- **FR-005**: All new commands MUST use the same JSON envelope output format (`{ ok, data?, error? }`) as existing commands
- **FR-006**: All new commands MUST support the `--pretty` flag for formatted output
- **FR-007**: All new commands MUST require a valid authenticated session and produce a clear error if unauthenticated or expired
- **FR-008**: The CLI MUST map raw API responses to clean, consistent shapes — stripping internal fields (e.g., `hmac`, internal IDs) and normalizing dates
- **FR-009**: All new commands MUST follow the existing `dubsado <resource> <action>` command pattern
- **FR-010**: Each client in list output MUST include at minimum: id, name fields, email, and creation date
- **FR-011**: Each form in list output MUST include at minimum: id, form type/name, submission date, and status

### Key Entities

- **Client**: A person or business in the user's Dubsado account. Key attributes: unique ID, first name, last name, email, phone, tags, creation date. Clients may be linked to projects.
- **Form**: A form that a customer has submitted in Dubsado — including questionnaires, intake forms, and contracts. Key attributes: unique ID, form type/name, submission date, status, associated client/project. Retrieved via the forms API endpoint with population enabled.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can retrieve their full client list in a single command invocation
- **SC-002**: Users can look up any individual client by ID in under 2 seconds
- **SC-003**: Users can retrieve their form list in a single command invocation
- **SC-004**: Users can look up any individual form by ID in under 2 seconds
- **SC-005**: All output is valid JSON parseable by standard tools (`jq`, LLM agents, etc.)
- **SC-006**: Error messages clearly indicate the cause and suggest corrective action (e.g., "Run 'dubsado auth login' first")
- **SC-007**: New commands are discoverable via `dubsado --help` and `dubsado <resource> --help`

## Assumptions

- The Dubsado v2 API exposes endpoints for reading clients and forms using the same JWT `token` cookie authentication established in feature 001
- Clients are accessible via the client search endpoint (`/api/clients/search`), which supports pagination, field selection, filtering, and sorting
- Forms are customer-submitted questionnaires, intake forms, and contracts — accessible via the forms API endpoint with population enabled
- The client search endpoint returns paginated results; the CLI retrieves the first page by default with reasonable defaults (count=50, page=1)
- The existing `authenticatedFetch()` utility and output helpers from feature 001 are reused without modification
- Client and form data does not require write operations — this feature is read-only (write operations like creating clients require CSRF tokens, which is out of scope)
- CLI resource names, type names, and field names always match Dubsado's own terminology and API naming
- Field filtering/mapping follows the same pattern as `user me` — strip internal fields, normalize dates, present clean shapes
