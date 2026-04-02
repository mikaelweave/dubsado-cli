import { readFile, writeFile, mkdir, unlink, stat } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Session } from '../types/index.js';
import { SESSION_VERSION } from '../types/index.js';
import { SESSION_PATH, SESSION_DIR } from './constants.js';

export async function readSession(): Promise<Session | null> {
  try {
    const raw = await readFile(SESSION_PATH, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (!validateSession(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writeSession(session: Session): Promise<void> {
  await mkdir(SESSION_DIR, { recursive: true });
  await writeFile(SESSION_PATH, JSON.stringify(session, null, 2), {
    mode: 0o600,
  });
}

export async function sessionExists(): Promise<boolean> {
  try {
    await stat(SESSION_PATH);
    return true;
  } catch {
    return false;
  }
}

export async function removeSession(): Promise<void> {
  try {
    await unlink(SESSION_PATH);
  } catch {
    // Ignore if file doesn't exist
  }
}

export async function checkPermissions(): Promise<boolean> {
  try {
    const info = await stat(SESSION_PATH);
    // Check that only owner has access (mode 0600 = octal 0o600 = 384)
    const mode = info.mode & 0o777;
    return mode === 0o600;
  } catch {
    return false;
  }
}

export function validateSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;

  if (obj.version !== SESSION_VERSION) return false;
  if (typeof obj.token !== 'string' || obj.token === '') return false;
  if (typeof obj.capturedAt !== 'string' || obj.capturedAt === '') return false;

  // Validate ISO 8601 date
  if (isNaN(Date.parse(obj.capturedAt as string))) return false;

  return true;
}
