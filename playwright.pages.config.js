import fs from 'node:fs';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/pages',
  use: {
    baseURL: 'http://127.0.0.1:4173/Stat_Learning_App/',
    headless: true,
    launchOptions: {
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH }
        : fs.existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {}),
    },
  },
  workers: 1,
  webServer: {
    command: 'npm run preview:pages',
    url: 'http://127.0.0.1:4173/Stat_Learning_App/',
    reuseExistingServer: false,
  },
  reporter: 'list',
});
