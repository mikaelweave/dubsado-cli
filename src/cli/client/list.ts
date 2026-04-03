import { Command } from 'commander';
import { authenticatedFetch, AuthError } from '../../lib/http.js';
import { success, failure, print } from '../../lib/output.js';
import type { Client } from '../../types/index.js';

/**
 * Map a raw Dubsado client object to the clean Client shape.
 * Allowlist: only known fields are emitted; everything else is stripped.
 */
export function mapClient(raw: Record<string, unknown>): Client {
  const company = raw.company as Record<string, unknown> | undefined;

  return {
    id: String(raw._id ?? ''),
    firstName: String(raw.firstName ?? ''),
    lastName: String(raw.lastName ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    company: String(company?.name ?? ''),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    createdAt: String(raw.createdAt ?? ''),
  };
}

export function makeClientListCommand(): Command {
  return new Command('list')
    .description('List clients from the authenticated Dubsado account')
    .action(async (_opts, cmd) => {
      const pretty = cmd.parent?.parent?.opts().pretty ?? false;

      try {
        const query = new URLSearchParams({
          count: '50',
          page: '1',
          sort: 'firstName',
          filter: JSON.stringify({ search: '' }),
          custom: JSON.stringify({
            select: '_id firstName lastName email company phone tags createdAt',
          }),
        });

        const response = await authenticatedFetch(`/api/clients/search?${query}`);

        if (!response.ok) {
          print(
            failure(`Dubsado API returned HTTP ${response.status}.`),
            pretty,
          );
          process.exit(1);
          return;
        }

        const body = await response.json() as Record<string, unknown>;

        // Unwrap: response may be { clients: [...] } or an array at root
        const rawClients = (Array.isArray(body.clients)
          ? body.clients
          : Array.isArray(body) ? body : []) as Record<string, unknown>[];

        const clients = rawClients.map(mapClient);
        print(success(clients), pretty);
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
