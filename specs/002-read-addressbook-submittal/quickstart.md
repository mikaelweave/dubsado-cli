# Quickstart: Read Client & Form Entities

**Feature**: 002-read-addressbook-submittal

## Prerequisites

- Node.js 20+ installed
- `dubsado-cli` built (`npm run build`)
- Authenticated session (`dubsado auth login`)

## List Clients

```bash
# List all clients (first page, sorted by first name)
dubsado client list

# With pretty-printing
dubsado client list --pretty

# Pipe through jq for specific fields
dubsado client list | jq '.data[] | {id, firstName, lastName, email}'
```

## Get a Single Client

```bash
# Get client by ID
dubsado client get 69cee6a7c563610589bf24a2

# Pretty-print
dubsado client get 69cee6a7c563610589bf24a2 --pretty
```

## List Forms

```bash
# List all form submissions
dubsado form list

# With pretty-printing
dubsado form list --pretty

# Filter forms by type using jq
dubsado form list | jq '.data[] | select(.type == "questionnaire")'
```

## Get a Single Form

```bash
# Get form by ID
dubsado form get 6a1234567890abcdef000001

# Pretty-print
dubsado form get 6a1234567890abcdef000001 --pretty
```

## Example Workflow: Find All Forms for a Client

```bash
# 1. Find the client
CLIENT_ID=$(dubsado client list | jq -r '.data[] | select(.email == "mikael@mikael.dev") | .id')

# 2. List all forms and filter by client
dubsado form list | jq --arg cid "$CLIENT_ID" '.data[] | select(.clientId == $cid)'
```

## Error Handling

All commands return a JSON envelope. Check the `ok` field:

```bash
RESULT=$(dubsado client list)
if echo "$RESULT" | jq -e '.ok' > /dev/null 2>&1; then
  echo "$RESULT" | jq '.data'
else
  echo "Error: $(echo "$RESULT" | jq -r '.error')" >&2
fi
```
