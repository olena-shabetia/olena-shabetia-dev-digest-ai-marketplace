import { useEffect, useRef, useState } from 'react';
import { navigate, parseHash, type Route } from '../router';
import { t } from '../messages';
import { applyTheme, currentTheme } from '../theme';
import { useCatalogCtx } from './context';

const LINKS = [
  { id: 'plugins', label: 'nav.plugins', short: 'nav.pluginsShort', to: '#/', match: (s: string[]) => !s.length || s[0] === 'plugin' || s[0] === 'artifact' || s[0] === 'search' },
  { id: 'install', label: 'nav.install', short: 'nav.installShort', to: '#/install', match: (s: string[]) => s[0] === 'install' },
  { id: 'whats-new', label: 'nav.whatsNew', short: 'nav.whatsNewShort', to: '#/whats-new', match: (s: string[]) => s[0] === 'whats-new' },
  { id: 'getting-started', label: 'nav.gettingStarted', short: 'nav.gettingStartedShort', to: '#/getting-started', match: (s: string[]) => s[0] === 'getting-started' },
] as const;

export function Header({ route, repo }: { route: Route; repo?: string }) {
  const onSearch = route.segments[0] === 'search';
  const urlQ = onSearch ? (route.query.get('q') ?? '') : '';
  const [value, setValue] = useState(urlQ);
  const [theme, setTheme] = useState(currentTheme);
  const timer = useRef<number>();

  useEffect(() => setValue(urlQ), [urlQ]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Read the live URL at call time: the debounce can fire after the route changed.
  function go(q: string, replaceEntry: boolean) {
    const live = parseHash(window.location.hash);
    const onSearchNow = live.segments[0] === 'search';
    const params = new URLSearchParams(onSearchNow ? live.query : undefined);
    if (q.trim()) params.set('q', q);
    else params.delete('q');
    if (!q.trim() && !onSearchNow) return;
    navigate(`#/search?${params.toString()}`, replaceEntry && onSearchNow);
  }

  return (
    <header className="site-header">
      <div className="container">
        <a className="brand" href="#/">
          <span className="brand-mark" aria-hidden="true">d</span>
          {t('app.brand')}
        </a>
        <form
          className="header-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            window.clearTimeout(timer.current);
            go(value, false);
          }}
        >
          <label>
            <span className="sr-only">{t('search.headerLabel')}</span>
            <input
              className="input"
              type="search"
              value={value}
              placeholder={t('search.headerPlaceholder')}
              onChange={(e) => {
                setValue(e.target.value);
                window.clearTimeout(timer.current);
                timer.current = window.setTimeout(() => go(e.target.value, true), 150);
              }}
            />
          </label>
        </form>
        <nav className="nav" aria-label={t('nav.aria')}>
          {LINKS.map((l) => (
            <a key={l.id} className="nav-link" href={l.to} aria-current={l.match(route.segments) ? 'page' : undefined}>
              <span className="long">{t(l.label)}</span>
              <span className="short">{t(l.short)}</span>
            </a>
          ))}
          {repo && (
            <a className="icon-link" href={`https://github.com/${repo}`} aria-label={t('nav.github')} target="_blank" rel="noopener noreferrer">
              {t('nav.githubShort')}
            </a>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            aria-label={t('nav.switchTheme', { theme: t(theme === 'dark' ? 'nav.themeLight' : 'nav.themeDark') })}
            onClick={() => {
              const next = theme === 'dark' ? 'light' : 'dark';
              applyTheme(next);
              setTheme(next);
            }}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </nav>
      </div>
    </header>
  );
}

/** Used by the 404 page, which has its own search box. */
export function SearchBox({ label = t('search.boxLabel') }: { label?: string }) {
  const { catalog } = useCatalogCtx();
  const [q, setQ] = useState('');
  return (
    <form
      style={{ width: '100%', maxWidth: 420 }}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`#/search?q=${encodeURIComponent(q)}`);
      }}
    >
      <label>
        <span className="sr-only">{label}</span>
        <input
          className="input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search.boxPlaceholder', { count: catalog.plugins.length })}
        />
      </label>
    </form>
  );
}
