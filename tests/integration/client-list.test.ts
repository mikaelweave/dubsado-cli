import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapClient } from '../../src/cli/client/list.js';
import { success, failure } from '../../src/lib/output.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, '..', 'fixtures', 'client-list-200.json'), 'utf-8'),
);

describe('client list integration', () => {
  it('maps fixture response to correct output envelope', () => {
    const clients = fixture.clients.map(
      (raw: Record<string, unknown>) => mapClient(raw),
    );
    const envelope = success(clients);

    expect(envelope.ok).toBe(true);
    expect(envelope.data).toBeDefined();
    expect(envelope.data!.length).toBe(2);
    expect(envelope.data![0].id).toBe('69cee6a7c563610589bf24a2');
    expect(envelope.data![0].firstName).toBe('Mikael');
    expect(envelope.data![0].company).toBe('Weaver Design Co');
  });

  it('produces valid JSON for empty client list', () => {
    const envelope = success([]);
    const json = JSON.stringify(envelope);
    const parsed = JSON.parse(json);

    expect(parsed.ok).toBe(true);
    expect(parsed.data).toEqual([]);
  });

  it('produces valid JSON for error scenarios', () => {
    const envelope = failure("Not authenticated. Run 'dubsado auth login' first.");
    const json = JSON.stringify(envelope);
    const parsed = JSON.parse(json);

    expect(parsed.ok).toBe(false);
    expect(parsed.error).toContain('Not authenticated');
    expect(parsed.data).toBeUndefined();
  });

  it('produces valid JSON for API error', () => {
    const envelope = failure('Dubsado API returned HTTP 500.');
    const json = JSON.stringify(envelope);
    const parsed = JSON.parse(json);

    expect(parsed.ok).toBe(false);
    expect(parsed.error).toContain('500');
  });
});
