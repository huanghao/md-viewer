import { defineConfig, devices } from '@playwright/test';

/**
 * Docker 内运行的 Playwright 配置
 * - 使用容器内部网络，不暴露到主机
 * - 无头模式运行（CI 环境）
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: {
    timeout: 8_000,
    toHaveScreenshot: {
      maxDiffPixels: 80,
    },
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    headless: true, // Docker 内必须无头
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run build:client && bun run src/server.ts',
    url: 'http://localhost:3000',
    reuseExistingServer: false, // Docker 内不重用，确保干净环境
    timeout: 120_000,
  },
});
