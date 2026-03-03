import { describe, expect, it } from 'bun:test';
import { stripWorkspaceTreeDisplayExtension } from '../../src/client/utils/workspace-file-name';

describe('stripWorkspaceTreeDisplayExtension', () => {
  it('strips md/html family suffix for workspace tree display', () => {
    expect(stripWorkspaceTreeDisplayExtension('README.md')).toBe('README');
    expect(stripWorkspaceTreeDisplayExtension('index.html')).toBe('index');
    expect(stripWorkspaceTreeDisplayExtension('guide.markdown')).toBe('guide');
    expect(stripWorkspaceTreeDisplayExtension('page.htm')).toBe('page');
  });

  it('keeps non-md/html suffix unchanged', () => {
    expect(stripWorkspaceTreeDisplayExtension('archive.tar.gz')).toBe('archive.tar.gz');
    expect(stripWorkspaceTreeDisplayExtension('notes.txt')).toBe('notes.txt');
  });

  it('does not return empty string after stripping', () => {
    expect(stripWorkspaceTreeDisplayExtension('.md')).toBe('.md');
    expect(stripWorkspaceTreeDisplayExtension('.html')).toBe('.html');
  });
});

