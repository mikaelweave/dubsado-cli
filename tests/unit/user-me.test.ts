import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapUserProfile } from '../../src/cli/user/me.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, '..', 'fixtures', 'user-self-200.json'), 'utf-8'),
);

describe('mapUserProfile', () => {
  it('maps v2 API response (with user wrapper) to UserProfile shape', () => {
    const profile = mapUserProfile(fixture);
    expect(profile).toEqual({
      id: '69ce8d50920cc40b63fb7d1f',
      email: 'mikael@mikael.dev',
      firstName: 'Mikael',
      lastName: 'Weaver',
      locale: 'en-us',
      isLocked: false,
      isSoftLocked: false,
      isUnverified: false,
      createdAt: '2026-04-02T15:37:52.247Z',
    });
  });

  it('excludes sensitive fields', () => {
    const profile = mapUserProfile(fixture);
    const keys = Object.keys(profile);
    expect(keys).not.toContain('hmac');
    expect(keys).not.toContain('attribution');
    expect(keys).not.toContain('emailPreferences');
    expect(keys).not.toContain('isCelsius');
    expect(keys).not.toContain('paymentFailedAttempts');
    expect(keys).not.toContain('bccMe');
    expect(keys).not.toContain('isNewDashboard');
  });

  it('handles missing contact fields gracefully', () => {
    const raw = { user: { ...fixture.user, contact: undefined } };
    const profile = mapUserProfile(raw as Record<string, unknown>);
    expect(profile.firstName).toBe('');
    expect(profile.lastName).toBe('');
  });

  it('handles unwrapped response (no user key)', () => {
    // If the response doesn't have a user wrapper, mapUserProfile should still work
    const unwrapped = fixture.user;
    const profile = mapUserProfile(unwrapped as Record<string, unknown>);
    expect(profile.email).toBe('mikael@mikael.dev');
  });

  it('handles createdAt as {$date} format (v3 compat)', () => {
    const raw = { user: { ...fixture.user, createdAt: { $date: '2026-01-01T00:00:00Z' } } };
    const profile = mapUserProfile(raw as Record<string, unknown>);
    expect(profile.createdAt).toBe('2026-01-01T00:00:00Z');
  });

  it('handles missing fields with empty defaults', () => {
    const raw = {};
    const profile = mapUserProfile(raw);
    expect(profile.id).toBe('');
    expect(profile.email).toBe('');
    expect(profile.firstName).toBe('');
    expect(profile.lastName).toBe('');
    expect(profile.locale).toBe('');
  });
});
