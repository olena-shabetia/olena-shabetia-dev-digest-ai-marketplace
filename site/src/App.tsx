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
import { t } from './messages';
import { parseHash, useHash, type Route } from './router';

function pageMeta(route: Route): { title: string } {
  const [page, a, b, c] = route.segments;
  const site = t('app.site');
  switch (page) {
    case undefined: return { title: t('title.home', { site }) };
    case 'search': {
      const q = route.query.get('q');
      return { title: q ? t('title.searchQuery', { q, site }) : t('title.search', { site }) };
    }
    case 'plugin': return { title: t('title.plugin', { name: a ?? '', site }) };
    case 'artifact': return { title: t('title.artifact', { name: c ?? '', type: b ?? '', plugin: a ?? '', site }) };
    case 'install': return { title: t('title.install', { site }) };
    case 'whats-new': return { title: t('title.whatsNew', { site }) };
    case 'getting-started': return { title: t('title.gettingStarted', { site }) };
    default: return { title: t('title.notFound', { site }) };
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
      ? (state.catalog.plugins.find((p) => p.id === route.segments[1])?.description ?? t('app.defaultDescription'))
      : t('app.defaultDescription');
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
        {t('app.skipLink')}
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
            {state.status === 'ready' ? t('footer.builtFrom', { date: new Date(state.catalog.generatedAt).toISOString().slice(0, 10) }) : t('footer.builtFromNoDate')}{' '}
            {repo ? <a href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer">{repo}</a> : t('footer.repoFallback')}
          </span>
          <span><a href="design/">{t('footer.design')}</a></span>
        </div>
      </footer>
    </>,
  );
}
