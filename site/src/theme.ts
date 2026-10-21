export type Theme = 'light' | 'dark';

const KEY = 'catalog-theme';

export function storedTheme(): Theme | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

export function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function currentTheme(): Theme {
  return (document.documentElement.dataset.theme as Theme | undefined) ?? storedTheme() ?? systemTheme();
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    /* storage can be blocked: the choice then lasts for this page view only */
  }
}
