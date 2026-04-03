import { Command } from 'commander';
import { authenticatedFetch, AuthError } from '../../lib/http.js';
import { success, failure, print } from '../../lib/output.js';
import { mapForm } from './list.js';

export function makeFormGetCommand(): Command {
  return new Command('get')
    .description('Retrieve a single form by Dubsado ID')
    .argument('<id>', 'Dubsado form ID')
    .action(async (id: string, _opts, cmd) => {
      const pretty = cmd.parent?.parent?.opts().pretty ?? false;

      try {
        const response = await authenticatedFetch(`/api/forms/${encodeURIComponent(id)}?populate=true`);

        if (!response.ok) {
          print(
            failure(`Dubsado API returned HTTP ${response.status}.`),
            pretty,
          );
          process.exit(1);
          return;
        }

        const body = await response.json() as Record<string, unknown>;

        // Unwrap: response may be { form: {...} } or object at root
        const rawForm = (body.form ?? body) as Record<string, unknown>;
        const form = mapForm(rawForm);
        print(success(form), pretty);
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
