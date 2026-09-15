const { defineConfig, devices } = require('@playwright/test');

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8901/pkd-digest/';

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  timeout: 60000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'e2e-chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'e2e-chromium-mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'bun run build && bunx eleventy --serve --port=8901',
    url: 'http://127.0.0.1:8901/pkd-digest/',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
