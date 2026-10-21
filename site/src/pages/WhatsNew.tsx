import { useCatalogCtx } from '../components/context';
import { t } from '../messages';
import { href, pluginHref, type Route } from '../router';
import type { Release } from '../types';

const fmt = (d: string | null) =>
  d ? new Date(`${d}T00:00:00Z`).toLocaleDateString(t('meta.locale'), { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' }) : t('whatsNew.undated');

export function ReleaseRows({ releases }: { releases: Release[] }) {
  if (!releases.length) return <p className="muted">{t('whatsNew.none')}</p>;
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
          <h1 className="page-title">{t('whatsNew.title')}</h1>
          <p style={{ fontSize: 15 }}>{t('whatsNew.subtitle')}</p>
        </div>
        <a className="btn btn-secondary" href={`${import.meta.env.BASE_URL}feed.xml`}>{t('whatsNew.feed')}</a>
      </div>
      {withReleases.length > 1 && (
        <div className="chips" role="group" aria-label={t('whatsNew.filterAria')}>
          <a className={`pill${!plugin ? ' pill-on' : ''}`} style={{ fontSize: 13 }} aria-pressed={!plugin} href={href('/whats-new')}>{t('whatsNew.allPlugins')}</a>
          {withReleases.map((p) => (
            <a key={p} className={`pill${plugin === p ? ' pill-on' : ''}`} style={{ fontSize: 13 }} aria-pressed={plugin === p} href={href('/whats-new', { plugin: p })}>{p}</a>
          ))}
        </div>
      )}
      {shown.length === 0 ? (
        <p className="muted">{t('whatsNew.emptyBefore')}<code>&lt;plugin&gt;--v&lt;version&gt;</code>{t('whatsNew.emptyAfter')}</p>
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
                    {t('whatsNew.tag', { tag: r.tag })}
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
