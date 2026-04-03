import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapClient } from '../../src/cli/client/list.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, '..', 'fixtures', 'client-list-200.json'), 'utf-8'),
);

describe('mapClient', () => {
  it('maps raw client object to clean Client shape', () => {
    const client = mapClient(fixture.clients[0]);
    expect(client).toEqual({
      id: '69cee6a7c563610589bf24a2',
      firstName: 'Mikael',
      lastName: 'Weaver',
      email: 'mikael@mikael.dev',
      phone: '555-123-4567',
      company: 'Weaver Design Co',
      tags: ['vip', 'photography'],
      createdAt: '2026-03-15T10:30:00.000Z',
    });
  });

  it('strips unknown/internal fields', () => {
    const client = mapClient(fixture.clients[0]);
    const keys = Object.keys(client);
    expect(keys).not.toContain('hmac');
    expect(keys).not.toContain('churnkey');
    expect(keys).not.toContain('attribution');
    expect(keys).not.toContain('__v');
    expect(keys).not.toContain('accountId');
    expect(keys).not.toContain('_id');
    expect(keys).not.toContain('address');
  });

  it('handles missing company name gracefully', () => {
    const client = mapClient(fixture.clients[1]);
    expect(client.company).toBe('');
  });

  it('handles empty tags array', () => {
    const client = mapClient(fixture.clients[1]);
    expect(client.tags).toEqual([]);
  });

  it('defaults missing fields to empty strings', () => {
    const client = mapClient({});
    expect(client.id).toBe('');
    expect(client.firstName).toBe('');
    expect(client.lastName).toBe('');
    expect(client.email).toBe('');
    expect(client.phone).toBe('');
    expect(client.company).toBe('');
    expect(client.tags).toEqual([]);
    expect(client.createdAt).toBe('');
  });

  it('handles missing tags field', () => {
    const client = mapClient({ _id: 'test', tags: undefined });
    expect(client.tags).toEqual([]);
  });
});
