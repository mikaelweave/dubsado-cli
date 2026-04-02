import { describe, it, expect } from 'vitest';
import { AuthError } from '../../src/lib/http.js';

describe('AuthError', () => {
  it('creates an error with name AuthError', () => {
    const err = new AuthError('test message');
    expect(err.name).toBe('AuthError');
    expect(err.message).toBe('test message');
    expect(err instanceof Error).toBe(true);
  });
});
