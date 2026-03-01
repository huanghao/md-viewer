import { Page } from '@playwright/test';

const CONFIG_KEY = 'md-viewer:config';
const STATE_KEY = 'md-viewer:openFiles';
const WORKSPACE_KNOWN_KEY = 'md-viewer:workspaceKnownFiles';

export async function resetAppStorage(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(({ configKey, stateKey, workspaceKnownKey }) => {
    localStorage.removeItem(configKey);
    localStorage.removeItem(stateKey);
    localStorage.removeItem(workspaceKnownKey);
  }, {
    configKey: CONFIG_KEY,
    stateKey: STATE_KEY,
    workspaceKnownKey: WORKSPACE_KNOWN_KEY,
  });
  await page.reload();
}

export async function seedConfig(page: Page, config: unknown): Promise<void> {
  await page.goto('/');
  await page.evaluate(({ configKey, value }) => {
    localStorage.setItem(configKey, JSON.stringify(value));
  }, { configKey: CONFIG_KEY, value: config });
  await page.reload();
}
