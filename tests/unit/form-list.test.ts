import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapForm } from '../../src/cli/form/list.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(__dirname, '..', 'fixtures', 'form-list-200.json'), 'utf-8'),
);

describe('mapForm', () => {
  it('maps raw form with populated client to clean Form shape', () => {
    const form = mapForm(fixture.forms[0]);
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

  it('handles bare client ID (not populated)', () => {
    const form = mapForm(fixture.forms[1]);
    expect(form.clientId).toBe('69cee6a7c563610589bf24b3');
    expect(form.clientName).toBe('');
  });

  it('strips unknown/internal fields', () => {
    const form = mapForm(fixture.forms[0]);
    const keys = Object.keys(form);
    expect(keys).not.toContain('__v');
    expect(keys).not.toContain('templateData');
    expect(keys).not.toContain('renderMeta');
    expect(keys).not.toContain('_id');
    expect(keys).not.toContain('formType');
    expect(keys).not.toContain('job');
  });

  it('maps formType to type field', () => {
    const form = mapForm(fixture.forms[0]);
    expect(form.type).toBe('questionnaire');
  });

  it('maps job to projectId field', () => {
    const form = mapForm(fixture.forms[0]);
    expect(form.projectId).toBe('6a1234567890abcdef000010');
  });

  it('defaults missing fields to empty strings', () => {
    const form = mapForm({});
    expect(form.id).toBe('');
    expect(form.name).toBe('');
    expect(form.type).toBe('');
    expect(form.status).toBe('');
    expect(form.clientId).toBe('');
    expect(form.clientName).toBe('');
    expect(form.projectId).toBe('');
    expect(form.createdAt).toBe('');
    expect(form.updatedAt).toBe('');
  });
});
