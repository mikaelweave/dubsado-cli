import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateSession } from '../../src/lib/session.js';
import type { Session } from '../../src/types/index.js';

const validSession: Session = {
  version: 1,
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJ0ZXN0IiwiZXhwIjoxNzc1NDE2MTI2fQ.test',
  capturedAt: '2026-04-02T15:37:52.000Z',
};

describe('auth export/import round-trip', () => {
  it('exports a session as base64 and re-imports it successfully', () => {
    // Export: JSON → base64
    const json = JSON.stringify(validSession);
    const blob = Buffer.from(json).toString('base64');

    // Import: base64 → JSON → validate
    const decoded = Buffer.from(blob, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    expect(validateSession(parsed)).toBe(true);
    expect(parsed).toEqual(validSession);
  });

  it('rejects a blob with wrong version', () => {
    const badSession = { ...validSession, version: 99 };
    const blob = Buffer.from(JSON.stringify(badSession)).toString('base64');
    const decoded = Buffer.from(blob, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    expect(validateSession(parsed)).toBe(false);
  });

  it('rejects a blob with invalid JSON', () => {
    const blob = Buffer.from('not valid json').toString('base64');
    const decoded = Buffer.from(blob, 'base64').toString('utf-8');
    expect(() => JSON.parse(decoded)).toThrow();
  });

  it('rejects a blob with missing token field', () => {
    const badSession = { version: 1, capturedAt: '2026-04-02T15:37:52.000Z' };
    const blob = Buffer.from(JSON.stringify(badSession)).toString('base64');
    const decoded = Buffer.from(blob, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    expect(validateSession(parsed)).toBe(false);
  });
});
