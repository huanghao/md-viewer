import { mdGithub } from './md-github';
import { mdNotion } from './md-notion';
import { mdBear } from './md-bear';
import { hlGithub } from './hl-github';
import { hlGithubDark } from './hl-github-dark';
import { hlAtomOneDark } from './hl-atom-one-dark';

export interface ThemeMeta {
  key: string;
  label: string;
  css: string;
}

export const MD_THEMES: ThemeMeta[] = [
  { key: 'github',  label: 'GitHub',          css: mdGithub },
  { key: 'notion',  label: 'Notion',           css: mdNotion },
  { key: 'bear',    label: 'Bear / iA Writer', css: mdBear },
];

export const HL_THEMES: ThemeMeta[] = [
  { key: 'github',        label: 'GitHub Light',  css: hlGithub },
  { key: 'github-dark',   label: 'GitHub Dark',   css: hlGithubDark },
  { key: 'atom-one-dark', label: 'Atom One Dark', css: hlAtomOneDark },
];

export function getMdThemeCss(key: string): string {
  return MD_THEMES.find(t => t.key === key)?.css ?? mdGithub;
}

export function getHlThemeCss(key: string): string {
  return HL_THEMES.find(t => t.key === key)?.css ?? hlGithub;
}
