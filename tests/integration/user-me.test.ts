import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapUserProfile } from '../../src/cli/user/me.js';
import { success, failure } from '../../src/lib/output.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture200 = JSON.parse(
  readFileSync(join(__dirname, '..', 'fixtures', 'user-self-200.json'), 'utf-8'),
);

describe('user me integration', () => {
  it('maps v2 fixture response (with user wrapper) to correct output envelope', () => {
    const profile = mapUserProfile(fixture200);
    const envelope = success(profile);

    expect(envelope.ok).toBe(true);
    expect(envelope.data).toBeDefined();
    expect(envelope.data!.id).toBe('69ce8d50920cc40b63fb7d1f');
    expect(envelope.data!.email).toBe('mikael@mikael.dev');
    expect(envelope.data!.firstName).toBe('Mikael');
    expect(envelope.data!.lastName).toBe('Weaver');
    expect(envelope.data!.locale).toBe('en-us');
    expect(envelope.data!.isLocked).toBe(false);
    expect(envelope.data!.createdAt).toBe('2026-04-02T15:37:52.247Z');
  });

  it('produces valid JSON for error scenarios', () => {
    const envelope = failure("Not authenticated. Run 'dubsado auth login' first.");
    const json = JSON.stringify(envelope);
    const parsed = JSON.parse(json);

    expect(parsed.ok).toBe(false);
    expect(parsed.error).toBe("Not authenticated. Run 'dubsado auth login' first.");
    expect(parsed.data).toBeUndefined();
  });

  it('produces valid JSON for expired session', () => {
    const envelope = failure("Session expired. Run 'dubsado auth login' to re-authenticate.");
    const json = JSON.stringify(envelope);
    const parsed = JSON.parse(json);

    expect(parsed.ok).toBe(false);
    expect(parsed.error).toContain('Session expired');
  });

  it('output envelope never has both data and error', () => {
    const okEnvelope = success(mapUserProfile(fixture200));
    expect(okEnvelope.data).toBeDefined();
    expect(okEnvelope.error).toBeUndefined();

    const errEnvelope = failure('error message');
    expect(errEnvelope.error).toBeDefined();
    expect(errEnvelope.data).toBeUndefined();
  });
});
