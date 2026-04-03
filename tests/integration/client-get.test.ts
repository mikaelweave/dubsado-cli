import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapClient } from '../../src/cli/client/list.js';
import { success, failure } from '../../src/lib/output.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, '..', 'fixtures', 'client-get-200.json'), 'utf-8'),
);

describe('client get integration', () => {
  it('maps single client fixture to correct output envelope', () => {
    const client = mapClient(fixture.client);
    const envelope = success(client);

    expect(envelope.ok).toBe(true);
    expect(envelope.data).toBeDefined();
    expect(envelope.data!.id).toBe('69cee6a7c563610589bf24a2');
    expect(envelope.data!.email).toBe('mikael@mikael.dev');
  });

  it('produces valid JSON for 404 error', () => {
    const envelope = failure('Dubsado API returned HTTP 404.');
    const json = JSON.stringify(envelope);
    const parsed = JSON.parse(json);

    expect(parsed.ok).toBe(false);
    expect(parsed.error).toContain('404');
  });

  it('produces valid JSON for auth error', () => {
    const envelope = failure("Session expired. Run 'dubsado auth login' to re-authenticate.");
    const json = JSON.stringify(envelope);
    const parsed = JSON.parse(json);

    expect(parsed.ok).toBe(false);
    expect(parsed.error).toContain('Session expired');
  });
});
