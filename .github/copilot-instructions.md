# dubsado-cli Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-02

## Active Technologies
- TypeScript (strict mode), Node.js 20 LTS + `commander` (CLI framework), native `fetch` (HTTP) — no new dependencies (002-read-addressbook-submittal)
- N/A (read-only commands; session from feature 001) (002-read-addressbook-submittal)

- TypeScript (strict mode), Node.js 20 LTS + `commander` (CLI framework), `playwright` (browser login), native `fetch` (HTTP) (001-auth-login-user-read)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript (strict mode), Node.js 20 LTS: Follow standard conventions

## Recent Changes
- 002-read-addressbook-submittal: Added TypeScript (strict mode), Node.js 20 LTS + `commander` (CLI framework), native `fetch` (HTTP) — no new dependencies

- 001-auth-login-user-read: Added TypeScript (strict mode), Node.js 20 LTS + `commander` (CLI framework), `playwright` (browser login), native `fetch` (HTTP)

<!-- MANUAL ADDITIONS START -->

## Naming Convention

Always match Dubsado's own terminology and API naming for CLI resource names, type names, and field names. Do not invent alternative names or abstractions — if Dubsado calls it "client", so does the CLI. When in doubt, check the Dubsado API endpoint path or web UI label.

<!-- MANUAL ADDITIONS END -->
