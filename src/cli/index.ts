#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { makeLoginCommand } from './auth/login.js';
import { makeExportCommand } from './auth/export.js';
import { makeStatusCommand } from './auth/status.js';
import { makeLogoutCommand } from './auth/logout.js';
import { makeMeCommand } from './user/me.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json (works from both src/ and dist/)
function getVersion(): string {
  for (const rel of ['../../package.json', '../package.json']) {
    try {
      const pkg = JSON.parse(readFileSync(join(__dirname, rel), 'utf-8'));
      return pkg.version;
    } catch {
      // try next
    }
  }
  return '0.0.0';
}

const program = new Command();

program
  .name('dubsado')
  .description('CLI wrapper for the Dubsado API')
  .version(getVersion())
  .option('--pretty', 'Format JSON output with indentation');

// Subcommand groups
const auth = program
  .command('auth')
  .description('Authentication commands');

auth.addCommand(makeLoginCommand());
auth.addCommand(makeExportCommand());
auth.addCommand(makeStatusCommand());
auth.addCommand(makeLogoutCommand());

const user = program
  .command('user')
  .description('User commands');

user.addCommand(makeMeCommand());

export { program, auth, user };

// Only parse when run directly (not imported for testing)
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('/cli/index.js') ||
   process.argv[1].endsWith('/cli/index.ts'));

if (isDirectRun) {
  program.parse();
}
