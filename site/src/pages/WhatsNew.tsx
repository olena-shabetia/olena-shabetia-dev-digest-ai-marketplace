import { useCatalogCtx } from '../components/context';
import { href, pluginHref, type Route } from '../router';
import type { Release } from '../types';

const fmt = (d: string | null) =>
  d ? new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' }) : 'Undated';

export function ReleaseRows({ releases }: { releases: Release[] }) {
  if (!releases.length) return <p className="muted">No tagged releases yet.</p>;
  return (
    <div>
      {releases.map((r) => (
        <div key={r.tag} className="release-row">
          <a className="mono" style={{ fontWeight: 700, fontSize: 15 }} href={pluginHref(r.plugin)}>{r.plugin}</a>
          <span className="mono" style={{ fontSize: 14 }}>v{r.version}</span>
          <span className="muted" style={{ fontSize: 14 }}>{fmt(r.date)}</span>
          <span>{r.note}</span>
        </div>
      ))}
    </div>
  );
}

export function WhatsNew({ route }: { route: Route }) {
  const { catalog } = useCatalogCtx();
  const plugin = route.query.get('plugin');
  const shown = catalog.releases.filter((r) => !plugin || r.plugin === plugin);
  const withReleases = [...new Set(catalog.releases.map((r) => r.plugin))];

  return (
    <>
      <div className="row row-between" style={{ alignItems: 'flex-end' }}>
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="page-title">What&apos;s new</h1>
          <p style={{ fontSize: 15 }}>Every tagged release, newest first.</p>
        </div>
        <a className="btn btn-secondary" href={`${import.meta.env.BASE_URL}feed.xml`}>Atom feed · feed.xml</a>
      </div>
      {withReleases.length > 1 && (
        <div className="chips" role="group" aria-label="Filter by plugin">
          <a className={`pill${!plugin ? ' pill-on' : ''}`} style={{ fontSize: 13 }} aria-pressed={!plugin} href={href('/whats-new')}>All plugins</a>
          {withReleases.map((p) => (
            <a key={p} className={`pill${plugin === p ? ' pill-on' : ''}`} style={{ fontSize: 13 }} aria-pressed={plugin === p} href={href('/whats-new', { plugin: p })}>{p}</a>
          ))}
        </div>
      )}
      {shown.length === 0 ? (
        <p className="muted">No tagged releases yet. Releases appear here once a <code>&lt;plugin&gt;--v&lt;version&gt;</code> tag is pushed.</p>
      ) : (
        <div className="stack" style={{ gap: 14 }}>
          {shown.map((r) => (
            <article key={r.tag} className="release-card">
              <div className="muted" style={{ fontSize: 13 }}>{fmt(r.date)}</div>
              <div className="stack" style={{ gap: 6 }}>
                <h2>
                  <a href={pluginHref(r.plugin)}>{r.plugin}</a> <span className="ver">v{r.version}</span>
                </h2>
                <p style={{ lineHeight: 1.55 }}>{r.note}</p>
                {r.tagged && (
                  <a style={{ fontSize: 13, fontWeight: 600 }} href={`https://github.com/${catalog.marketplace.repo}/releases/tag/${r.tag}`} target="_blank" rel="noopener noreferrer">
                    Tag {r.tag} ↗
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
