import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, readFile, mkdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateSession } from '../../src/lib/session.js';
import type { Session } from '../../src/types/index.js';

// We test validateSession directly (pure function).
// For read/write, we test against the real filesystem with a temp dir.

const validSession: Session = {
  version: 1,
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJ0ZXN0IiwiZXhwIjoxNzc1NDE2MTI2fQ.test',
  capturedAt: '2026-04-02T15:37:52.000Z',
};

describe('validateSession', () => {
  it('accepts a valid session', () => {
    expect(validateSession(validSession)).toBe(true);
  });

  it('rejects null', () => {
    expect(validateSession(null)).toBe(false);
  });

  it('rejects non-object', () => {
    expect(validateSession('string')).toBe(false);
  });

  it('rejects wrong version', () => {
    expect(validateSession({ ...validSession, version: 2 })).toBe(false);
  });

  it('rejects missing token', () => {
    expect(validateSession({ ...validSession, token: '' })).toBe(false);
  });

  it('rejects missing capturedAt', () => {
    expect(validateSession({ ...validSession, capturedAt: '' })).toBe(false);
  });

  it('rejects invalid capturedAt date', () => {
    expect(validateSession({ ...validSession, capturedAt: 'not-a-date' })).toBe(false);
  });
});
