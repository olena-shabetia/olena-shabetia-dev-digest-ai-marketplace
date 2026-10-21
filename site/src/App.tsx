import { useEffect, useMemo, useRef } from 'react';
import { CatalogProvider } from './components/context';
import { Header, SearchBox } from './components/Header';
import { ErrorState, NotFound, PageSkeleton } from './components/States';
import { useCatalog } from './data';
import { ArtifactPage } from './pages/Artifact';
import { GettingStarted } from './pages/GettingStarted';
import { Home } from './pages/Home';
import { InstallPage } from './pages/Install';
import { PluginPage } from './pages/Plugin';
import { Search } from './pages/Search';
import { WhatsNew } from './pages/WhatsNew';
import { parseHash, useHash, type Route } from './router';

const SITE = 'dev-digest marketplace';
const DEFAULT_DESCRIPTION = 'Search Claude Code plugins, skills, agents, commands and hooks from the dev-digest marketplace and install them in one line.';

function pageMeta(route: Route): { title: string; description?: string } {
  const [page, a, b, c] = route.segments;
  switch (page) {
    case undefined: return { title: `${SITE} — find a Claude Code plugin` };
    case 'search': return { title: route.query.get('q') ? `“${route.query.get('q')}” — search · ${SITE}` : `Search · ${SITE}` };
    case 'plugin': return { title: `${a} · ${SITE}` };
    case 'artifact': return { title: `${c} (${b}) · ${a} · ${SITE}` };
    case 'install': return { title: `Install builder · ${SITE}` };
    case 'whats-new': return { title: `What's new · ${SITE}` };
    case 'getting-started': return { title: `Getting started · ${SITE}` };
    default: return { title: `Not found · ${SITE}` };
  }
}

export function App() {
  const hash = useHash();
  const route = useMemo(() => parseHash(hash), [hash]);
  const state = useCatalog();
  const first = useRef(true);

  const meta = pageMeta(route);
  useEffect(() => {
    document.title = meta.title;
    let el = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!el) {
      el = document.createElement('meta');
      el.name = 'description';
      document.head.appendChild(el);
    }
    el.content = state.status === 'ready' && route.segments[0] === 'plugin'
      ? (state.catalog.plugins.find((p) => p.id === route.segments[1])?.description ?? DEFAULT_DESCRIPTION)
      : DEFAULT_DESCRIPTION;
  }, [meta.title, route.segments, state]);

  // New page: back to the top and move focus to the content. Anchors (?h=) and same-page changes keep the scroll.
  const pageKey = route.segments.join('/');
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (route.query.get('h')) return;
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const repo = state.status === 'ready' ? state.catalog.marketplace.repo : undefined;
  const page = route.segments[0];

  let content;
  if (state.status === 'loading') content = <PageSkeleton />;
  else if (state.status === 'error') content = <ErrorState message={state.message} onRetry={state.retry} />;
  else {
    content = (
      <CatalogProvider value={{ catalog: state.catalog, index: state.index }}>
        {page === undefined ? <Home />
          : page === 'search' ? <Search route={route} />
          : page === 'plugin' && route.segments.length === 2 ? <PluginPage route={route} />
          : page === 'artifact' && route.segments.length === 4 ? <ArtifactPage route={route} />
          : page === 'install' ? <InstallPage route={route} />
          : page === 'whats-new' ? <WhatsNew route={route} />
          : page === 'getting-started' ? <GettingStarted />
          : <NotFound search={<SearchBox />} />}
      </CatalogProvider>
    );
  }

  const shell = (children: React.ReactNode) => (
    <div className="app">
      <a className="skip-link" href={`${route.base}?h=main`} onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      {children}
    </div>
  );

  const header =
    state.status === 'ready' ? (
      <CatalogProvider value={{ catalog: state.catalog, index: state.index }}>
        <Header route={route} repo={repo} />
      </CatalogProvider>
    ) : (
      <Header route={route} />
    );

  return shell(
    <>
      {header}
      <div className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <main id="main" tabIndex={-1}>{content}</main>
      </div>
      <footer className="site-footer">
        <div className="container">
          <span>
            {state.status === 'ready' ? `Catalog built ${new Date(state.catalog.generatedAt).toISOString().slice(0, 10)} from ` : 'Built from '}
            {repo ? <a href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer">{repo}</a> : 'the marketplace repository'}
          </span>
          <span><a href="design/">Design mockups</a></span>
        </div>
      </footer>
    </>,
  );
}
