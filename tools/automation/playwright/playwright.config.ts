import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'test',
  retries: 0,
  timeout: 30000,
  use: {
    headless: true,
    actionTimeout: 10000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  reporter: [['list']]
});


