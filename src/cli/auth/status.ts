import { Command } from 'commander';
import { readSession, checkPermissions } from '../../lib/session.js';
import { authenticatedFetch, AuthError } from '../../lib/http.js';
import { success, failure, print, diagnostic } from '../../lib/output.js';

export function makeStatusCommand(): Command {
  return new Command('status')
    .description('Check whether the stored session is still valid')
    .action(async (_opts, cmd) => {
      const pretty = cmd.parent?.parent?.opts().pretty ?? false;

      try {
        const session = await readSession();
        if (!session) {
          print(failure("No active session. Run 'dubsado auth login' first."), pretty);
          process.exit(1);
          return;
        }

        // Warn about insecure file permissions
        const permsOk = await checkPermissions();
        if (!permsOk) {
          diagnostic(
            'Warning: Session file has insecure permissions. ' +
            'Run: chmod 600 ~/.config/dubsado-cli/session.json',
          );
        }

        // Make a lightweight request to verify the session
        const response = await authenticatedFetch('/api/users/self');
        if (response.ok) {
          const body = await response.json() as Record<string, unknown>;
          const user = (body.user ?? body) as Record<string, unknown>;
          print(
            success({
              authenticated: true,
              email: user.email ?? '',
              capturedAt: session.capturedAt,
            }),
            pretty,
          );
        } else {
          print(
            failure("Session expired. Run 'dubsado auth login' to re-authenticate."),
            pretty,
          );
          process.exit(1);
        }
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
