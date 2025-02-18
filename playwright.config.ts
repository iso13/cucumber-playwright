import { defineConfig } from '@playwright/test';
import { environments } from './src/support/environments';

// Determine the baseURL based on the environment variable ENV, default to 'qa' if not provided
const envKey = process.env.ENV as keyof typeof environments ?? 'qa';
const baseURL = environments[envKey];

// Set Playwright worker count dynamically from an environment variable or default to 2
const workers = process.env.PLAYWRIGHT_WORKERS ? parseInt(process.env.PLAYWRIGHT_WORKERS) : 2;

export default defineConfig({
  workers, // Enable parallel execution with dynamic worker count
  expect: {
    timeout: 10000, // 10 seconds
  },
  use: {
    baseURL, // Set the baseURL based on the environment
    headless: true, // Run in headless mode for CI/CD efficiency
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true, // Ignore HTTPS errors for dev environments

    // Set navigation and action timeouts
    navigationTimeout: 15000, // Set navigation timeout to 15 seconds
    actionTimeout: 10000, // Set action timeout to 10 seconds
  },

  // Enable parallel execution for multi-browser testing
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],

  // Configure retries for flaky tests (useful for CI/CD)
  retries: process.env.CI ? 2 : 0, // Retry twice if running in CI

  // Configure test reporting
  reporter: [
    ['list'], // Console output
    ['json', { outputFile: 'test-results.json' }], // JSON report for analysis
    ['html', { outputFolder: 'report', open: 'never' }], // HTML report
  ],
});