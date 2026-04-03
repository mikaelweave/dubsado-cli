import { Command } from 'commander';
import { authenticatedFetch, AuthError } from '../../lib/http.js';
import { success, failure, print } from '../../lib/output.js';
import { mapClient } from './list.js';

export function makeClientGetCommand(): Command {
  return new Command('get')
    .description('Retrieve a single client by Dubsado ID')
    .argument('<id>', 'Dubsado client ID')
    .action(async (id: string, _opts, cmd) => {
      const pretty = cmd.parent?.parent?.opts().pretty ?? false;

      try {
        const response = await authenticatedFetch(`/api/clients/${encodeURIComponent(id)}`);

        if (!response.ok) {
          print(
            failure(`Dubsado API returned HTTP ${response.status}.`),
            pretty,
          );
          process.exit(1);
          return;
        }

        const body = await response.json() as Record<string, unknown>;

        // Unwrap: response may be { client: {...} } or object at root
        const rawClient = (body.client ?? body) as Record<string, unknown>;
        const client = mapClient(rawClient);
        print(success(client), pretty);
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
