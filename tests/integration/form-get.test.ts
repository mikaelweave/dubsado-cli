import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapForm } from '../../src/cli/form/list.js';
import { success, failure } from '../../src/lib/output.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, '..', 'fixtures', 'form-get-200.json'), 'utf-8'),
);

describe('form get integration', () => {
  it('maps single form fixture to correct output envelope', () => {
    const form = mapForm(fixture.form);
    const envelope = success(form);

    expect(envelope.ok).toBe(true);
    expect(envelope.data).toBeDefined();
    expect(envelope.data!.id).toBe('6a1234567890abcdef000001');
    expect(envelope.data!.name).toBe('Client Questionnaire');
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
