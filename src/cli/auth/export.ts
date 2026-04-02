import { Command } from 'commander';
import { readSession } from '../../lib/session.js';
import { success, failure, print } from '../../lib/output.js';

export function makeExportCommand(): Command {
  return new Command('export')
    .description('Print the current session as a portable base64-encoded blob')
    .action(async (_opts, cmd) => {
      const pretty = cmd.parent?.parent?.opts().pretty ?? false;

      try {
        const session = await readSession();
        if (!session) {
          print(failure("No active session. Run 'dubsado auth login' first."), pretty);
          process.exit(1);
          return;
        }

        const json = JSON.stringify(session);
        const blob = Buffer.from(json).toString('base64');
        print(success({ blob }), pretty);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        print(failure(message), pretty);
        process.exit(1);
      }
    });
}
