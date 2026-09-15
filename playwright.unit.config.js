const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/unit',
  fullyParallel: true,
  reporter: [['list']],
  timeout: 30000,
});
