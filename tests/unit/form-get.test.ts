import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapForm } from '../../src/cli/form/list.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, '..', 'fixtures', 'form-get-200.json'), 'utf-8'),
);

describe('mapForm (single form)', () => {
  it('maps wrapped single-form response with populated client', () => {
    const form = mapForm(fixture.form);
    expect(form).toEqual({
      id: '6a1234567890abcdef000001',
      name: 'Client Questionnaire',
      type: 'questionnaire',
      status: 'completed',
      clientId: '69cee6a7c563610589bf24a2',
      clientName: 'Mikael Weaver',
      projectId: '6a1234567890abcdef000010',
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-02T14:30:00.000Z',
    });
  });

  it('strips internal fields from single response', () => {
    const form = mapForm(fixture.form);
    const keys = Object.keys(form);
    expect(keys).not.toContain('__v');
    expect(keys).not.toContain('templateData');
    expect(keys).not.toContain('renderMeta');
  });
});
