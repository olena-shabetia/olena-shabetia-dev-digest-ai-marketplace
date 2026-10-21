import { useState } from 'react';
import { Card } from '../components/Card';
import { CodeBlock } from '../components/CodeBlock';
import { useCatalogCtx } from '../components/context';
import { DepGraph } from '../components/DepGraph';
import { Markdown } from '../components/Markdown';
import { Segmented } from '../components/Segmented';
import { TypeBadge } from '../components/TypeBadge';
import { githubTree } from '../data';
import { buildCommands } from '../install';
import { t } from '../messages';
import { href, pluginHref, type Route } from '../router';
import { ARTIFACT_TYPES, type Channel, type Scope } from '../types';
import { NotFound } from '../components/States';
import { SearchBox } from '../components/Header';

const TABS = ['overview', 'contents', 'dependencies', 'changelog'] as const;
type Tab = (typeof TABS)[number];

export function PluginPage({ route }: { route: Route }) {
  const { catalog } = useCatalogCtx();
  const plugin = catalog.plugins.find((p) => p.id === route.segments[1]);
  const [scope, setScope] = useState<Scope>('project');
  const [channel, setChannel] = useState<Channel>('latest');
  if (!plugin) return <NotFound search={<SearchBox />} />;

  const tabParam = route.query.get('tab');
  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? '') ? (tabParam as Tab) : 'overview';
  const mine = catalog.artifacts.filter((a) => a.plugin === plugin.id);
  const { add, installs } = buildCommands(catalog, [plugin.id], scope, channel);
  const pulled = plugin.dependencies.map((d) => d.name);
  const total = ARTIFACT_TYPES.reduce((n, ty) => n + plugin.counts[ty], 0);
  const summary = ARTIFACT_TYPES.filter((ty) => plugin.counts[ty]).map((ty) => t(`types.count.${ty}`, { count: plugin.counts[ty] })).join(' · ');

  return (
    <>
      <div className="breadcrumb">
        <a href="#/">{t('plugin.breadcrumb')}</a> / <span className="mono">{plugin.id}</span>
      </div>
      <header className="stack" style={{ gap: 12, maxWidth: 780 }}>
        <div className="row">
          <TypeBadge type="plugin" />
          <span className="mono" style={{ fontSize: 14 }}>v{plugin.version}</span>
          {plugin.minClaudeCodeVersion && <span className="tag">{t('plugin.minClaudeCode', { version: plugin.minClaudeCodeVersion })}</span>}
        </div>
        <h1 className="mono" style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(28px, 5vw, 40px)', overflowWrap: 'anywhere' }}>{plugin.id}</h1>
        <p className="lead">{plugin.description}</p>
        <a href={githubTree(catalog.marketplace.repo, plugin.path)} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 14 }}>
          {t('plugin.onGithub', { path: plugin.path })}
        </a>
      </header>

      <section className="panel" aria-labelledby="install-title">
        <div className="row row-between">
          <h2 id="install-title">{t('plugin.installTitle')}</h2>
          <div className="row" style={{ gap: 20 }}>
            <Segmented label={t('plugin.scope')} value={scope} options={['project', 'user'] as const} onChange={setScope} />
            <Segmented label={t('plugin.channel')} value={channel} options={['latest', 'stable'] as const} onChange={setChannel} />
          </div>
        </div>
        <div className="label">{t('plugin.stepAdd')}</div>
        <CodeBlock code={add} />
        <div className="label">{t('plugin.stepInstall')}</div>
        <CodeBlock code={installs[installs.length - 1]} />
        {pulled.length > 0 && (
          <p style={{ fontSize: 14 }}>
            {t('plugin.alsoInstalls', { count: pulled.length })}{' '}
            {pulled.map((d, i) => (
              <span key={d}>
                {i > 0 && ', '}
                <a className="mono" href={pluginHref(d)}>{d}</a>
              </span>
            ))}
            . <a href={href('/install', { plugins: plugin.id, scope, channel })}>{t('plugin.buildCustom')}</a>
          </p>
        )}
      </section>

      <div role="tablist" aria-label={t('plugin.tabsAria')} className="tabs">
        {TABS.map((tb) => (
          <a key={tb} role="tab" className="tab" aria-selected={tab === tb} href={`${pluginHref(plugin.id)}?tab=${tb}`}>
            {t(`plugin.tabs.${tb}`)}
          </a>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'overview' &&
          (plugin.readme ? (
            <Markdown source={plugin.readme} baseDir={plugin.path} anchorBase={pluginHref(plugin.id)} scrollTo={route.query.get('h')} />
          ) : (
            <p className="muted">{t('plugin.noReadme')}</p>
          ))}

        {tab === 'contents' && (
          <section aria-labelledby="contents-title" className="stack">
            <h2 id="contents-title" style={{ fontSize: 24 }}>{t('plugin.contentsTitle')}</h2>
            <p style={{ fontSize: 14 }}>{total ? summary : t('plugin.contentsEmpty')}</p>
            {ARTIFACT_TYPES.map((ty) => {
              const items = mine.filter((a) => a.type === ty);
              return items.length ? (
                <div key={ty} className="stack">
                  <h3 style={{ fontSize: 18, textTransform: 'capitalize' }}>{t(`types.plural.${ty}`)}</h3>
                  <div className="grid">{items.map((a) => <Card key={a.id} artifact={a} />)}</div>
                </div>
              ) : null;
            })}
          </section>
        )}

        {tab === 'dependencies' && (
          <section aria-labelledby="deps-title" className="stack">
            <h2 id="deps-title" style={{ fontSize: 24 }}>{t('plugin.dependenciesTitle')}</h2>
            <div className="layout-deps">
              <DepGraph id={plugin.id} requires={plugin.dependencies.map((d) => d.name)} requiredBy={plugin.dependents} />
              <div className="stack" style={{ gap: 18 }}>
                <div>
                  <h3 style={{ font: '700 14px var(--font-body)', marginBottom: 8 }}>{t('plugin.requires')}</h3>
                  {plugin.dependencies.length ? (
                    <ul className="plain-list">
                      {plugin.dependencies.map((d) => (
                        <li key={d.name}>
                          <a href={pluginHref(d.name)}>{d.name}</a> <span className="muted">{d.range}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted" style={{ fontSize: 14 }}>{t('plugin.noDependencies')}</p>
                  )}
                </div>
                <div>
                  <h3 style={{ font: '700 14px var(--font-body)', marginBottom: 8 }}>{t('plugin.requiredBy')}</h3>
                  {plugin.dependents.length ? (
                    <ul className="plain-list">
                      {plugin.dependents.map((d) => (
                        <li key={d}><a href={pluginHref(d)}>{d}</a></li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted" style={{ fontSize: 14 }}>{t('plugin.noDependents')}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === 'changelog' && (
          <section aria-labelledby="changelog-title" className="stack">
            <h2 id="changelog-title" style={{ fontSize: 24 }}>{t('plugin.changelogTitle')}</h2>
            {plugin.changelog.length ? (
              plugin.changelog.map((e) => (
                <article key={e.version} className="stack" style={{ gap: 8 }}>
                  <h3 style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 17 }}>
                    {e.version} {e.date && <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>· {e.date}</span>}
                  </h3>
                  <Markdown source={e.markdown} baseDir={plugin.path} anchorBase={pluginHref(plugin.id)} />
                </article>
              ))
            ) : (
              <p className="muted">{t('plugin.noChangelog')}</p>
            )}
          </section>
        )}
      </div>
    </>
  );
}
