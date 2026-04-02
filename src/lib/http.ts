import { readSession } from './session.js';
import { BASE_URL } from './constants.js';
import { diagnostic } from './output.js';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const session = await readSession();
  if (!session) {
    throw new AuthError("Not authenticated. Run 'dubsado auth login' first.");
  }

  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers as Record<string, string>,
      'cookie': `token=${session.token}`,
    },
  });

  if (response.status === 401) {
    throw new AuthError("Session expired. Run 'dubsado auth login' to re-authenticate.");
  }

  // Detect login-redirect responses (Dubsado may redirect to login page)
  if (response.redirected && response.url.includes('/login')) {
    throw new AuthError("Session expired. Run 'dubsado auth login' to re-authenticate.");
  }

  // Log rate limit info to stderr for debugging
  const ratePolicy = response.headers.get('ratelimit-policy');
  if (ratePolicy) {
    diagnostic(`Rate limit: ${ratePolicy}`);
  }

  return response;
}
