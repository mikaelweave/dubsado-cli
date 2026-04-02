import { homedir } from 'node:os';
import { join } from 'node:path';

export const BASE_URL = 'https://hello.dubsado.com';

export const SESSION_DIR = join(homedir(), '.config', 'dubsado-cli');
export const SESSION_PATH = join(SESSION_DIR, 'session.json');

export const LOGIN_TIMEOUT_MS = 300_000; // 5 minutes
