import { Command } from 'commander';
import { authenticatedFetch, AuthError } from '../../lib/http.js';
import { success, failure, print } from '../../lib/output.js';
import type { UserProfile } from '../../types/index.js';

/** Fields to exclude from the API response */
const EXCLUDED_FIELDS = new Set([
  'hmac',
  'churnkey',
  'attribution',
  'emailPreferences',
  'isCelsius',
  'paymentFailedAttempts',
  'bccMe',
  'isNewDashboard',
]);

/**
 * Map the raw Dubsado v2 /api/users/self response to our clean UserProfile shape.
 * v2 wraps user in {user: ...} and uses plain ISO date strings.
 */
export function mapUserProfile(raw: Record<string, unknown>): UserProfile {
  // v2 wraps in {user: ...}, but handle both shapes
  const user = (raw.user ?? raw) as Record<string, unknown>;
  const contact = (user.contact ?? {}) as Record<string, unknown>;
  const createdAt = user.createdAt;

  // createdAt can be { $date: "..." } (v3 MongoDB extended JSON) or a plain ISO string (v2)
  let createdAtStr = '';
  if (typeof createdAt === 'object' && createdAt !== null && '$date' in (createdAt as Record<string, unknown>)) {
    createdAtStr = String((createdAt as Record<string, unknown>).$date);
  } else if (typeof createdAt === 'string') {
    createdAtStr = createdAt;
  }

  return {
    id: String(user._id ?? ''),
    email: String(user.email ?? ''),
    firstName: String(contact.firstName ?? ''),
    lastName: String(contact.lastName ?? ''),
    locale: String(user.locale ?? ''),
    isLocked: Boolean(user.isLocked),
    isSoftLocked: Boolean(user.isSoftLocked),
    isUnverified: Boolean(user.isUnverified),
    createdAt: createdAtStr,
  };
}

export function makeMeCommand(): Command {
  return new Command('me')
    .description('Retrieve the currently authenticated user\'s profile')
    .action(async (_opts, cmd) => {
      const pretty = cmd.parent?.parent?.opts().pretty ?? false;

      try {
        const response = await authenticatedFetch('/api/users/self');

        if (!response.ok) {
          print(
            failure(`Dubsado API returned HTTP ${response.status}.`),
            pretty,
          );
          process.exit(1);
          return;
        }

        const body = await response.json() as Record<string, unknown>;
        const profile = mapUserProfile(body);
        print(success(profile), pretty);
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
