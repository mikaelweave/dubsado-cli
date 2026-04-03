import { Command } from 'commander';
import { authenticatedFetch, AuthError } from '../../lib/http.js';
import { success, failure, print } from '../../lib/output.js';
import type { Form } from '../../types/index.js';

/**
 * Map a raw Dubsado form object to the clean Form shape.
 * Handles both populated client references and bare IDs.
 */
export function mapForm(raw: Record<string, unknown>): Form {
  const client = raw.client as Record<string, unknown> | string | undefined;

  let clientId = '';
  let clientName = '';
  if (typeof client === 'object' && client !== null) {
    clientId = String(client._id ?? '');
    const first = String(client.firstName ?? '');
    const last = String(client.lastName ?? '');
    clientName = [first, last].filter(Boolean).join(' ');
  } else if (typeof client === 'string') {
    clientId = client;
  }

  return {
    id: String(raw._id ?? ''),
    name: String(raw.name ?? raw.title ?? ''),
    type: String(raw.formType ?? raw.type ?? ''),
    status: String(raw.status ?? ''),
    clientId,
    clientName,
    projectId: String(raw.projectId ?? raw.job ?? ''),
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

export function makeFormListCommand(): Command {
  return new Command('list')
    .description('List forms from the authenticated Dubsado account')
    .action(async (_opts, cmd) => {
      const pretty = cmd.parent?.parent?.opts().pretty ?? false;

      try {
        const response = await authenticatedFetch('/api/forms/?populate=true');

        if (!response.ok) {
          print(
            failure(`Dubsado API returned HTTP ${response.status}.`),
            pretty,
          );
          process.exit(1);
          return;
        }

        const body = await response.json() as Record<string, unknown>;

        // Unwrap: response may be { forms: [...] } or an array at root
        const rawForms = (Array.isArray(body.forms)
          ? body.forms
          : Array.isArray(body) ? body : []) as Record<string, unknown>[];

        const forms = rawForms.map(mapForm);
        print(success(forms), pretty);
      } catch (err) {
        if (err instanceof AuthError) {
          print(failure(err.message), pretty);
          process.exit(1);
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        print(failure(message), pretty);
        process.exit(1);
      }
    });
}
