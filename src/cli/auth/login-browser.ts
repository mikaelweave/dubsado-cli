import type { Session } from '../../types/index.js';
import { SESSION_VERSION } from '../../types/index.js';
import { BASE_URL, LOGIN_TIMEOUT_MS } from '../../lib/constants.js';
import { writeSession } from '../../lib/session.js';
import { diagnostic } from '../../lib/output.js';

function isHeadlessEnvironment(): boolean {
  // No TTY = likely SSH / CI / agentic
  if (!process.stdout.isTTY) return true;
  // On Linux, no DISPLAY and no WAYLAND_DISPLAY = no GUI
  if (process.platform === 'linux') {
    if (!process.env['DISPLAY'] && !process.env['WAYLAND_DISPLAY']) return true;
  }
  return false;
}

export interface BrowserLoginResult {
  email: string;
  brandId: string;
}

export async function loginBrowser(
  timeoutMs: number = LOGIN_TIMEOUT_MS,
): Promise<BrowserLoginResult> {
  if (isHeadlessEnvironment()) {
    throw new Error(
      'No display detected. Use "dubsado auth login --import <blob>" or ' +
      '"dubsado auth login --headless" for headless environments.',
    );
  }

  let chromium: typeof import('playwright-core').chromium;
  try {
    const pw = await import('playwright-core');
    chromium = pw.chromium;
  } catch {
    throw new Error(
      'playwright-core is required for browser login. ' +
      'Run "npx playwright install chromium" to install the browser.',
    );
  }

  diagnostic('Opening browser for Dubsado login...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/user/login`, { waitUntil: 'networkidle' });

    diagnostic('Waiting for login to complete...');

    // Wait for the JWT token cookie to appear
    const result = await Promise.race([
      waitForTokenCookie(context, timeoutMs),
      waitForBrowserClose(page),
    ]);

    if (result === 'closed') {
      throw new Error(
        'Login cancelled — browser was closed before authentication completed.',
      );
    }

    const tokenValue = result;

    // Decode JWT to extract email and brandId
    let email = '';
    let brandId = '';
    try {
      const payload = JSON.parse(
        Buffer.from(tokenValue.split('.')[1], 'base64').toString('utf-8'),
      );
      email = payload.email ?? '';
      brandId = payload.activeBrand ?? '';
    } catch {
      // Non-critical — JWT decode failure doesn't block session save
    }

    const session: Session = {
      version: SESSION_VERSION,
      token: tokenValue,
      capturedAt: new Date().toISOString(),
    };

    await writeSession(session);

    return { email, brandId };
  } finally {
    await browser.close();
  }
}

async function waitForTokenCookie(
  context: import('playwright-core').BrowserContext,
  timeoutMs: number,
): Promise<string> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const cookies = await context.cookies(BASE_URL);
    const tokenCookie = cookies.find((c) => c.name === 'token');
    if (tokenCookie && tokenCookie.value) {
      return tokenCookie.value;
    }
    // Poll every 500ms
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(
    `Login timed out after ${Math.round(timeoutMs / 1000)} seconds. ` +
    'Please try again.',
  );
}

async function waitForBrowserClose(
  page: import('playwright-core').Page,
): Promise<'closed'> {
  return new Promise((resolve) => {
    page.on('close', () => resolve('closed'));
  });
}
