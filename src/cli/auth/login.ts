import { Command } from 'commander';
import { success, failure, print } from '../../lib/output.js';
import { loginBrowser } from './login-browser.js';
import { loginHeadless } from './login-headless.js';
import { loginImport } from './login-import.js';

export function makeLoginCommand(): Command {
  const login = new Command('login')
    .description('Authenticate with Dubsado')
    .option('--import <blob>', 'Import a base64-encoded session blob (use "-" for stdin)')
    .option('--headless', 'Use headless credential login (for bots/CI)')
    .option('--email <email>', 'Dubsado account email (or DUBSADO_EMAIL env var)')
    .option('--password <password>', 'Dubsado account password (or DUBSADO_PASSWORD env var)')
    .option('--timeout <seconds>', 'Max wait time for browser login', '300')
    .action(async (opts, cmd) => {
      const pretty = cmd.parent?.parent?.opts().pretty ?? false;

      try {
        if (opts.import) {
          // Import mode
          await loginImport(opts.import);
          print(success({ imported: true }), pretty);
        } else if (opts.headless) {
          // Headless mode
          const result = await loginHeadless({
            email: opts.email,
            password: opts.password,
          });
          print(success({ email: result.email, brandId: result.brandId }), pretty);
        } else {
          // Browser mode (default)
          const timeoutMs = parseInt(opts.timeout, 10) * 1000;
          const result = await loginBrowser(timeoutMs);
          print(success({ email: result.email, brandId: result.brandId }), pretty);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        print(failure(message), pretty);
        process.exit(1);
      }
    });

  return login;
}
