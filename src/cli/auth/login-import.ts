import { writeSession, validateSession } from '../../lib/session.js';

export async function loginImport(blob: string): Promise<void> {
  // Read from stdin if blob is "-"
  let input = blob;
  if (input === '-') {
    input = await readStdin();
  }

  input = input.trim();
  if (!input) {
    throw new Error('Empty session blob. Provide a base64-encoded blob from "dubsado auth export".');
  }

  let decoded: string;
  try {
    decoded = Buffer.from(input, 'base64').toString('utf-8');
  } catch {
    throw new Error('Invalid base64 encoding. The blob may be corrupted.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    throw new Error('Invalid session blob — not valid JSON after base64 decoding.');
  }

  if (!validateSession(parsed)) {
    throw new Error(
      'Invalid or incompatible session blob. The session format may be from a different CLI version. ' +
      'Export a fresh session with "dubsado auth export" and try again.',
    );
  }

  await writeSession(parsed);
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    process.stdin.on('error', reject);

    // Timeout after 5 seconds if no input
    setTimeout(() => {
      if (chunks.length === 0) {
        reject(new Error('No input received on stdin. Pipe a session blob or provide it as an argument.'));
      }
    }, 5000);
  });
}
