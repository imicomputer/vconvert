import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: '/tmp/vconvert-playwright-test-results',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome']
  },
  webServer: {
    command: './node_modules/.bin/tsx src/index.ts',
    url: 'http://127.0.0.1:3000/health',
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      NODE_ENV: 'development',
      PORT: '3000',
      UPLOAD_DIR: '/tmp/vconvert-playwright-uploads',
      HARDWARE_DETECTION_TIMEOUT_MS: '500',
      FILE_CLEANUP_INTERVAL_MS: '60000'
    }
  }
});