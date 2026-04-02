import type { Session } from '../../types/index.js';
import { SESSION_VERSION } from '../../types/index.js';
import { BASE_URL } from '../../lib/constants.js';
import { writeSession } from '../../lib/session.js';
import { diagnostic } from '../../lib/output.js';

export interface HeadlessLoginOptions {
  email?: string;
  password?: string;
}

export interface HeadlessLoginResult {
  email: string;
  brandId: string;
}

export async function loginHeadless(
  options: HeadlessLoginOptions,
): Promise<HeadlessLoginResult> {
  const email = options.email || process.env['DUBSADO_EMAIL'];
  const password = options.password || process.env['DUBSADO_PASSWORD'];

  if (!email || !password) {
    const missing: string[] = [];
    if (!email) missing.push('--email or DUBSADO_EMAIL');
    if (!password) missing.push('--password or DUBSADO_PASSWORD');
    throw new Error(
      `Missing credentials: ${missing.join(', ')}. ` +
      'Provide via flags or environment variables.',
    );
  }

  // v2 login still requires CSRF for POST. Use Playwright headless to automate
  // the login form, which handles CSRF and any client-side token generation.
  diagnostic('Attempting headless login via Playwright...');
  return loginHeadlessViaPlaywright(email, password);
}

/**
 * Use Playwright in headless mode to automate the v2 login form.
 * The v2 login page handles CSRF token generation client-side.
 */
async function loginHeadlessViaPlaywright(
  email: string,
  password: string,
): Promise<HeadlessLoginResult> {
  let chromium: typeof import('playwright-core').chromium;
  try {
    const pw = await import('playwright-core');
    chromium = pw.chromium;
  } catch {
    throw new Error(
      'Headless login requires playwright-core. ' +
      'Run "npx playwright install chromium" to install the browser.',
    );
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/user/login`, { waitUntil: 'networkidle' });

    // Fill in the login form
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"], input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for token cookie to appear
    const start = Date.now();
    const timeoutMs = 30_000;

    while (Date.now() - start < timeoutMs) {
      const cookies = await context.cookies(BASE_URL);
      const tokenCookie = cookies.find((c) => c.name === 'token');
      if (tokenCookie && tokenCookie.value) {
        // Decode JWT to extract email and brandId
        let brandId = '';
        try {
          const payload = JSON.parse(
            Buffer.from(tokenCookie.value.split('.')[1], 'base64').toString('utf-8'),
          );
          brandId = payload.activeBrand ?? '';
        } catch {
          // Non-critical
        }

        const session: Session = {
          version: SESSION_VERSION,
          token: tokenCookie.value,
          capturedAt: new Date().toISOString(),
        };

        await writeSession(session);
        return { email, brandId };
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(
      'Headless login timed out waiting for token cookie. ' +
      'The login may have failed — check credentials.',
    );
  } finally {
    await browser.close();
  }
}
