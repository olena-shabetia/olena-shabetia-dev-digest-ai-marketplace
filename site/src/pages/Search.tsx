import { useMemo } from 'react';
import { Card } from '../components/Card';
import { useCatalogCtx } from '../components/context';
import { t, tl } from '../messages';
import { href, navigate, type Route } from '../router';
import { facetCounts, parseQuery, search } from '../search';
import { ITEM_TYPES, type ItemType } from '../types';

const csv = (v: string | null): string[] => (v ? v.split(',').filter(Boolean) : []);
const TYPE_WORD = /\b(?:plugin|skill|agent|command|hook)s?\b/gi;

export function Search({ route }: { route: Route }) {
  const { catalog, index } = useCatalogCtx();
  const q = route.query.get('q') ?? '';
  const types = csv(route.query.get('type')).filter((x): x is ItemType => (ITEM_TYPES as string[]).includes(x));
  const plugins = csv(route.query.get('plugin'));

  const result = useMemo(() => search(index, q, { types, plugins }), [index, q, types.join(), plugins.join()]);
  const facets = useMemo(() => facetCounts(index, q, { types, plugins }), [index, q, types.join(), plugins.join()]);

  const update = (next: { q?: string; types?: string[]; plugins?: string[] }) =>
    navigate(href('/search', { q: next.q ?? q, type: next.types ?? types, plugin: next.plugins ?? plugins }));
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const inferred = !types.length ? result.inferredTypes : [];
  const filtersActive = types.length > 0 || plugins.length > 0 || q.trim() !== '';
  const cards = result.hits.filter((h) => h.kind !== 'doc');
  const docs = result.hits.filter((h) => h.kind === 'doc');
  const title = q.trim() ? t('search.title', { q: q.trim() }) : t('search.titleEmpty');
  const issueUrl = `https://github.com/${catalog.marketplace.repo}/issues/new?template=suggestion.yml&title=${encodeURIComponent(t('search.suggestionTitle', { q: q.trim() }))}`;

  return (
    <div className="layout-filters">
      <aside aria-label={t('search.filtersAria')} className="filters">
        <fieldset>
          <legend className="kicker">{t('search.typeLegend')}</legend>
          <div className="filter-list">
            {ITEM_TYPES.map((ty) => {
              const checked = types.includes(ty) || (!types.length && inferred.includes(ty));
              return (
                <label key={ty} className="check">
                  <input type="checkbox" checked={checked} disabled={!facets.types[ty] && !checked} onChange={() => update({ types: toggle(types.length ? types : inferred, ty), q: types.length ? q : q.replace(TYPE_WORD, ' ').replace(/\s+/g, ' ').trim() })} />
                  <span className="grow" style={{ textTransform: 'capitalize' }}>{t(`types.singular.${ty}`)}</span>
                  <span className="count">{facets.types[ty]}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend className="kicker">{t('search.pluginLegend')}</legend>
          <div className="filter-list">
            {catalog.plugins.map((p) => (
              <label key={p.id} className="check">
                <input type="checkbox" checked={plugins.includes(p.id)} onChange={() => update({ plugins: toggle(plugins, p.id) })} />
                <span className="grow mono" style={{ fontSize: 13 }}>{p.id}</span>
                <span className="count">{facets.plugins[p.id] ?? 0}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </aside>

      <div className="stack" style={{ minWidth: 0 }}>
        <div className="stack" style={{ gap: 8 }}>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 32px)' }}>{title}</h1>
          <div aria-live="polite" style={{ fontSize: 14 }}>
            <strong>{t('search.results', { count: cards.length + docs.length })}</strong>
            {inferred.length > 0 && t('search.typeInferred')}
            {result.terms.length > 0 && (
              <>
                {t('search.termsUsedInline')}
                {result.terms.map((term, i) => (
                  <span key={term}>
                    {i > 0 && ', '}
                    <code>{term}</code>
                  </span>
                ))}
              </>
            )}
          </div>
          {(types.length > 0 || inferred.length > 0 || plugins.length > 0) && (
            <div className="chips">
              {types.map((ty) => (
                <Chip key={`t-${ty}`} label={t('search.chipType', { value: t(`types.singular.${ty}`) })} onRemove={() => update({ types: types.filter((x) => x !== ty) })} />
              ))}
              {inferred.map((ty) => (
                <Chip key={`i-${ty}`} label={t('search.chipType', { value: t(`types.singular.${ty}`) })} onRemove={() => update({ q: q.replace(TYPE_WORD, ' ').replace(/\s+/g, ' ').trim() })} />
              ))}
              {plugins.map((p) => (
                <Chip key={`p-${p}`} label={t('search.chipPlugin', { value: p })} onRemove={() => update({ plugins: plugins.filter((x) => x !== p) })} />
              ))}
            </div>
          )}
        </div>

        {cards.length > 0 && (
          <div className="grid grid-2">
            {cards.map((h) =>
              h.kind === 'plugin' ? (
                <Card key={`p-${h.item.id}`} plugin={h.item} terms={result.terms} />
              ) : h.kind === 'artifact' ? (
                <Card key={`a-${h.item.id}`} artifact={h.item} terms={result.terms} />
              ) : null,
            )}
          </div>
        )}

        {docs.length > 0 && (
          <section aria-labelledby="docs-title" className="stack">
            <h2 id="docs-title" style={{ fontSize: 22 }}>{t('search.docsTitle')}</h2>
            <div className="doc-list">
              {docs.map((h) =>
                h.kind === 'doc' ? (
                  <a key={h.item.id} className="doc-hit" href={`https://github.com/${catalog.marketplace.repo}/blob/main/${h.item.id}`} target="_blank" rel="noopener noreferrer">
                    <strong>{h.item.title}</strong> <span className="mono muted" style={{ fontSize: 12 }}>{h.item.id} ↗</span>
                  </a>
                ) : null,
              )}
            </div>
          </section>
        )}

        {cards.length + docs.length === 0 && (
          <div className="state" style={{ gap: 18 }}>
            {!filtersActive ? (
              <>
                <p>{t('search.emptyPrompt')}</p>
                <div className="chips">
                  {tl('searchExamples').map((e) => (
                    <a key={e} className="pill" style={{ fontWeight: 400 }} href={href('/search', { q: e })}>{e}</a>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.15 }}>
                  {q.trim() ? t('search.noResultsFor', { q: q.trim() }) : t('search.nothingMatches')}
                </h2>
                {parseQuery(q).terms.length > 0 && (
                  <p>
                    {t('search.termsUsed')} {parseQuery(q).terms.map((term) => <code key={term} style={{ marginRight: 6 }}>{term}</code>)}
                  </p>
                )}
                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
                  <li>{t('search.tipFewerWords')}</li>
                  <li>{t('search.tipRemoveFilter')}</li>
                  <li>{t('search.tipSpelling')}</li>
                </ul>
                <div className="row">
                  <a className="btn btn-primary" href="#/">{t('search.browseAll')}</a>
                  <a className="btn btn-secondary" href={issueUrl} target="_blank" rel="noopener noreferrer">{t('search.suggest')}</a>
                </div>
                <p className="muted" style={{ fontSize: 13 }}>{t('search.suggestNote')}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="chip-removable">
      {label}
      <button type="button" aria-label={t('search.removeFilter', { label })} onClick={onRemove}>×</button>
    </span>
  );
}
