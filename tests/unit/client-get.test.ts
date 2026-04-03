import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapClient } from '../../src/cli/client/list.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, '..', 'fixtures', 'client-get-200.json'), 'utf-8'),
);

describe('mapClient (single client)', () => {
  it('maps wrapped single-client response', () => {
    const client = mapClient(fixture.client);
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

  it('strips internal fields from single response', () => {
    const client = mapClient(fixture.client);
    const keys = Object.keys(client);
    expect(keys).not.toContain('hmac');
    expect(keys).not.toContain('__v');
    expect(keys).not.toContain('accountId');
    expect(keys).not.toContain('address');
  });
});
