import { defineConfig, devices } from '@playwright/test';
import { dirname } from 'path';

// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const baseURL = `http://localhost:${process.env.PORT ?? 3000}`;
const isCI = !!process.env.CI;

// Reference: https://playwright.dev/docs/test-configuration
export default defineConfig({
  // Timeout per test
  timeout: 30 * 1000,
  // Test directory
  testDir: dirname('e2e/*'),
  // If a test fails, retry it additional 2 times
  retries: 2,
  
  reporter: 'html',
  // Run your local dev server before starting the tests:
  // https://playwright.dev/docs/test-advanced#launching-a-development-web-server-during-the-tests
  webServer: {
    command: 'SKIP_ENV_VALIDATION=true npm run dev',
    url: baseURL,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },

  use: {
    // Use baseURL so to make navigations relative.
    // More information: https://playwright.dev/docs/api/class-testoptions#test-options-base-url
    baseURL,

    // Retry a test if its failing with enabled tracing. This allows you to analyze the DOM, console logs, network traffic etc.
    // More information: https://playwright.dev/docs/trace-viewer
    trace: 'retry-with-trace',

    // All available context options: https://playwright.dev/docs/api/class-browser#browser-new-context
    // contextOptions: {
    //   ignoreHTTPSErrors: true,
    // },
    locale: 'en-US',
    timezoneId: 'UTC',
     // Capture screenshot after each test failure.
    screenshot: 'only-on-failure',
     // Run tests in headless browsers (set to false to see tests running in the browser)
    headless: process.env.HEADLESS !== 'false',
    browserName: 'chromium',
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    ...(isCI
      ? []
      : [
          // {
          //   name: 'Desktop Firefox',
          //   use: {
          //     ...devices['Desktop Firefox'],
          //   },
          // },
          {
            name: 'Desktop Safari',
            use: {
              ...devices['Desktop Safari'],
            },
          },
          // Test against mobile viewports.
          {
            name: 'Mobile Chrome',
            use: {
              ...devices['Pixel 5'],
            },
          },
          {
            name: 'Mobile Safari',
            use: devices['iPhone 12'],
          },
        ]),
  ],
});
