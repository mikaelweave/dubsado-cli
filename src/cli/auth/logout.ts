import { Command } from 'commander';
import { removeSession } from '../../lib/session.js';
import { success, failure, print } from '../../lib/output.js';

export function makeLogoutCommand(): Command {
  return new Command('logout')
    .description('Delete the stored session file')
    .action(async (_opts, cmd) => {
      const pretty = cmd.parent?.parent?.opts().pretty ?? false;

      try {
        await removeSession();
        print(success({}), pretty);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        print(failure(message), pretty);
        process.exit(1);
      }
    });
}
