import { CodeBlock } from '../components/CodeBlock';
import { useCatalogCtx } from '../components/context';
import { Segmented } from '../components/Segmented';
import { buildScript, resolveSelection } from '../install';
import { t } from '../messages';
import { href, navigate, type Route } from '../router';
import type { Channel, Scope } from '../types';

const csv = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);

export function InstallPage({ route }: { route: Route }) {
  const { catalog } = useCatalogCtx();
  const known = new Set(catalog.plugins.map((p) => p.id));
  const selected = csv(route.query.get('plugins')).filter((p) => known.has(p));
  const scope: Scope = route.query.get('scope') === 'user' ? 'user' : 'project';
  const channel: Channel = route.query.get('channel') === 'stable' ? 'stable' : 'latest';
  const { requiredBy } = resolveSelection(selected, catalog.plugins);

  const set = (next: { plugins?: string[]; scope?: Scope; channel?: Channel }) =>
    navigate(href('/install', { plugins: next.plugins ?? selected, scope: next.scope ?? scope, channel: next.channel ?? channel }), true);
  const toggle = (id: string) => set({ plugins: selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id] });

  const script = buildScript(catalog, selected, scope, channel);
  const shareUrl = href('/install', { plugins: selected, scope, channel });

  return (
    <>
      <div className="stack" style={{ gap: 8 }}>
        <h1 className="page-title">{t('installPage.title')}</h1>
        <p style={{ fontSize: 16 }}>{t('installPage.intro')}</p>
      </div>
      <div className="layout-split">
        <div className="stack" style={{ gap: 22 }}>
          <fieldset className="stack" style={{ gap: 10 }}>
            <legend className="kicker">{t('installPage.pluginsLegend')}</legend>
            {catalog.plugins.map((p) => {
              const pulledBy = requiredBy.get(p.id);
              const locked = !selected.includes(p.id) && !!pulledBy;
              const on = selected.includes(p.id) || locked;
              return (
                <label key={p.id} className={`lock-row${selected.includes(p.id) ? ' on' : ''}`}>
                  <input type="checkbox" className="check-input" style={{ width: 18, height: 18, accentColor: 'var(--color-accent)' }} checked={on} disabled={locked} onChange={() => toggle(p.id)} />
                  <span className="mono">{p.id}</span>
                  <small>{locked ? t('installPage.requiredBy', { list: pulledBy!.join(', ') }) : selected.includes(p.id) ? t('installPage.selected') : t('card.version', { version: p.version })}</small>
                </label>
              );
            })}
          </fieldset>
          <div className="row" style={{ gap: 24, alignItems: 'flex-start' }}>
            <Segmented column label={t('installPage.scope')} value={scope} options={['project', 'user'] as const} onChange={(s) => set({ scope: s })} />
            <Segmented column label={t('installPage.channel')} value={channel} options={['latest', 'stable'] as const} onChange={(c) => set({ channel: c })} />
          </div>
        </div>
        <section className="panel sticky" aria-labelledby="out-title">
          <h2 id="out-title" style={{ fontSize: 22 }}>{t('installPage.scriptTitle')}</h2>
          {!selected.length && <p className="muted" style={{ fontSize: 14 }}>{t('installPage.selectOne')}</p>}
          <CodeBlock code={script} label={t('installPage.copyScript')} />
          {selected.length > 0 && (
            <a className="mono" style={{ fontSize: 13, overflowWrap: 'anywhere' }} href={shareUrl}>
              {shareUrl}
            </a>
          )}
        </section>
      </div>
    </>
  );
}
