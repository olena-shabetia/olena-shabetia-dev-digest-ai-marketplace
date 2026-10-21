import { useMemo } from 'react';
import { Card } from '../components/Card';
import { useCatalogCtx } from '../components/context';
import { href, navigate, type Route } from '../router';
import { facetCounts, parseQuery, search } from '../search';
import { ITEM_TYPES, type ItemType } from '../types';

const csv = (v: string | null): string[] => (v ? v.split(',').filter(Boolean) : []);
const TYPE_WORD = /\b(?:plugin|skill|agent|command|hook)s?\b/gi;

export function Search({ route }: { route: Route }) {
  const { catalog, index } = useCatalogCtx();
  const q = route.query.get('q') ?? '';
  const types = csv(route.query.get('type')).filter((t): t is ItemType => (ITEM_TYPES as string[]).includes(t));
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
  const title = q.trim() ? `Results for “${q.trim()}”` : 'Search the catalog';
  const issueUrl = `https://github.com/${catalog.marketplace.repo}/issues/new?template=suggestion.yml&title=${encodeURIComponent(`Suggestion: ${q.trim()}`)}`;

  return (
    <div className="layout-filters">
      <aside aria-label="Filters" className="filters">
        <fieldset>
          <legend className="kicker">Type</legend>
          <div className="filter-list">
            {ITEM_TYPES.map((t) => {
              const checked = types.includes(t) || (!types.length && inferred.includes(t));
              return (
                <label key={t} className="check">
                  <input type="checkbox" checked={checked} disabled={!facets.types[t] && !checked} onChange={() => update({ types: toggle(types.length ? types : inferred, t), q: types.length ? q : q.replace(TYPE_WORD, ' ').replace(/\s+/g, ' ').trim() })} />
                  <span className="grow" style={{ textTransform: 'capitalize' }}>{t}</span>
                  <span className="count">{facets.types[t]}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend className="kicker">Plugin</legend>
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
            <strong>{cards.length + docs.length} {cards.length + docs.length === 1 ? 'result' : 'results'}</strong>
            {inferred.length > 0 && ' · type inferred from your phrase'}
            {result.terms.length > 0 && (
              <>
                {' · terms used: '}
                {result.terms.map((t, i) => (
                  <span key={t}>
                    {i > 0 && ', '}
                    <code>{t}</code>
                  </span>
                ))}
              </>
            )}
          </div>
          {(types.length > 0 || inferred.length > 0 || plugins.length > 0) && (
            <div className="chips">
              {types.map((t) => (
                <Chip key={`t-${t}`} label={`Type: ${t}`} onRemove={() => update({ types: types.filter((x) => x !== t) })} />
              ))}
              {inferred.map((t) => (
                <Chip key={`i-${t}`} label={`Type: ${t}`} onRemove={() => update({ q: q.replace(TYPE_WORD, ' ').replace(/\s+/g, ' ').trim() })} />
              ))}
              {plugins.map((p) => (
                <Chip key={`p-${p}`} label={`Plugin: ${p}`} onRemove={() => update({ plugins: plugins.filter((x) => x !== p) })} />
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
            <h2 id="docs-title" style={{ fontSize: 22 }}>Documentation</h2>
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
                <p>Type what you need in the search box, for example:</p>
                <div className="chips">
                  {['review architecture', 'agent for code review', 'write a spec'].map((e) => (
                    <a key={e} className="pill" style={{ fontWeight: 400 }} href={href('/search', { q: e })}>{e}</a>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.15 }}>
                  {q.trim() ? `No results for ‘${q.trim()}’` : 'Nothing matches these filters'}
                </h2>
                {parseQuery(q).terms.length > 0 && (
                  <p>
                    Terms used: {parseQuery(q).terms.map((t) => <code key={t} style={{ marginRight: 6 }}>{t}</code>)}
                  </p>
                )}
                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
                  <li>Try fewer or more general words.</li>
                  <li>Remove a type or plugin filter.</li>
                  <li>Check the spelling — matching is forgiving, but not magic.</li>
                </ul>
                <div className="row">
                  <a className="btn btn-primary" href="#/">Browse all plugins</a>
                  <a className="btn btn-secondary" href={issueUrl} target="_blank" rel="noopener noreferrer">Suggest a skill ↗</a>
                </div>
                <p className="muted" style={{ fontSize: 13 }}>“Suggest a skill” opens a prefilled GitHub issue with your query.</p>
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
      <button type="button" aria-label={`Remove filter ${label}`} onClick={onRemove}>×</button>
    </span>
  );
}
