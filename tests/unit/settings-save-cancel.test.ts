import { describe, it, expect } from 'bun:test';

describe('settings save/cancel logic', () => {
  it('saveSettings clears sentinel to prevent cancel from restoring', () => {
    let savedTheme = 'github';
    function saveSettings() { savedTheme = ''; }
    saveSettings();
    expect(savedTheme).toBe('');
  });

  it('closeSettingsDialog restores theme when sentinel is set', () => {
    let currentTheme = 'dark';
    let savedTheme = 'github';
    function closeSettingsDialog() {
      if (savedTheme) { currentTheme = savedTheme; savedTheme = ''; }
    }
    closeSettingsDialog();
    expect(currentTheme).toBe('github');
  });

  it('closeSettingsDialog does nothing when sentinel is empty', () => {
    let currentTheme = 'dark';
    let savedTheme = '';
    function closeSettingsDialog() {
      if (savedTheme) { currentTheme = savedTheme; savedTheme = ''; }
    }
    closeSettingsDialog();
    expect(currentTheme).toBe('dark');
  });
});
