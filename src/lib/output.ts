import type { OutputEnvelope } from '../types/index.js';

export function success<T>(data: T): OutputEnvelope<T> {
  return { ok: true, data };
}

export function failure(error: string): OutputEnvelope<never> {
  return { ok: false, error };
}

export function print(envelope: OutputEnvelope, pretty: boolean): void {
  const json = pretty
    ? JSON.stringify(envelope, null, 2)
    : JSON.stringify(envelope);
  process.stdout.write(json + '\n');
}

export function diagnostic(message: string): void {
  process.stderr.write(message + '\n');
}
