import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import 'dotenv/config'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 4,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.CI ? 'npm run dev:next' : 'npm run dev',
    reuseExistingServer: !process.env.CI,
    url: 'http://localhost:3000',
    timeout: 120 * 1000, // 2 minutes timeout for CI
    env: {
      DATABASE_URI: process.env.DATABASE_URI || 'mongodb://localhost:27017/workout-app-test',
      NODE_ENV: process.env.NODE_ENV || 'test',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-placeholder',
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'test-payload-secret-placeholder',
    },
  },
})
