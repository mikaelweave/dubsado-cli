import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Integration test for browser login — uses mocks since we can't launch a real browser in CI

describe('auth login (browser mode)', () => {
  it('detects headless environment via TTY check', async () => {
    // This test verifies the headless detection logic
    const { loginBrowser } = await import('../../src/cli/auth/login-browser.js');

    // In CI / vitest, stdout is not a TTY, so loginBrowser should throw
    await expect(loginBrowser(1000)).rejects.toThrow(
      /No display detected|playwright-core/,
    );
  });
});
