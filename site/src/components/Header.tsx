import { useEffect, useRef, useState } from 'react';
import { navigate, parseHash, type Route } from '../router';
import { applyTheme, currentTheme } from '../theme';
import { useCatalogCtx } from './context';

const LINKS = [
  { label: 'Plugins', short: 'Plugins', to: '#/', match: (s: string[]) => !s.length || s[0] === 'plugin' || s[0] === 'artifact' || s[0] === 'search' },
  { label: 'Install', short: 'Install', to: '#/install', match: (s: string[]) => s[0] === 'install' },
  { label: "What's new", short: 'New', to: '#/whats-new', match: (s: string[]) => s[0] === 'whats-new' },
  { label: 'Getting started', short: 'Start', to: '#/getting-started', match: (s: string[]) => s[0] === 'getting-started' },
];

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
          dev-digest
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
            <span className="sr-only">Search catalog</span>
            <input
              className="input"
              type="search"
              value={value}
              placeholder="Search plugins, skills, agents…"
              onChange={(e) => {
                setValue(e.target.value);
                window.clearTimeout(timer.current);
                timer.current = window.setTimeout(() => go(e.target.value, true), 150);
              }}
            />
          </label>
        </form>
        <nav className="nav" aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.label} className="nav-link" href={l.to} aria-current={l.match(route.segments) ? 'page' : undefined}>
              <span className="long">{l.label}</span>
              <span className="short">{l.short}</span>
            </a>
          ))}
          {repo && (
            <a className="icon-link" href={`https://github.com/${repo}`} aria-label="GitHub repository" target="_blank" rel="noopener noreferrer">
              GH
            </a>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
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
export function SearchBox({ label = 'Search' }: { label?: string }) {
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
          placeholder={`Search ${catalog.plugins.length} plugins, skills, agents…`}
        />
      </label>
    </form>
  );
}
