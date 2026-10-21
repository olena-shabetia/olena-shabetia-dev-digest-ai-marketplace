import { useState } from 'react';
import { Card } from '../components/Card';
import { useCatalogCtx } from '../components/context';
import { ReleaseRows } from './WhatsNew';
import { href, navigate } from '../router';
import { ITEM_TYPES, type ItemType } from '../types';

const EXAMPLES = ['review architecture', 'agent for code review', 'write a spec', 'commit hooks'];

export function Home() {
  const { catalog } = useCatalogCtx();
  const [q, setQ] = useState('');
  const counts: Record<ItemType, number> = {
    plugin: catalog.plugins.length,
    skill: catalog.artifacts.filter((a) => a.type === 'skill').length,
    agent: catalog.artifacts.filter((a) => a.type === 'agent').length,
    command: catalog.artifacts.filter((a) => a.type === 'command').length,
    hook: catalog.artifacts.filter((a) => a.type === 'hook').length,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">Find a Claude Code plugin by describing the task.</h1>
          <p className="lead">
            Skills, agents, commands and hooks from the dev-digest marketplace — searchable, with a one-line install.
          </p>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) navigate(href('/search', { q }));
            }}
          >
            <label>
              <span className="sr-only">Search the catalog</span>
              <input
                className="input"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="I need a skill for reviewing architecture"
              />
            </label>
          </form>
          <div className="chips">
            <span className="muted" style={{ fontSize: 13 }}>Try</span>
            {EXAMPLES.map((e) => (
              <a key={e} className="pill" style={{ fontWeight: 400, fontSize: 14 }} href={href('/search', { q: e })}>
                {e}
              </a>
            ))}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span>$ claude plugin install</span>
        </div>
      </section>

      <nav className="chips" aria-label="Browse by type">
        <a className="pill" href={href('/search', { type: ITEM_TYPES })}>
          <span className="pill-dot" style={{ background: 'var(--color-text)' }} />
          All <span className="count">{total}</span>
        </a>
        {ITEM_TYPES.map((t) =>
          counts[t] ? (
            <a key={t} className="pill" href={href('/search', { type: t })}>
              <span className="pill-dot" style={{ background: `var(--t-${t})` }} />
              {t}s <span className="count">{counts[t]}</span>
            </a>
          ) : (
            <span key={t} className="pill" aria-disabled="true" style={{ opacity: 0.55 }}>
              <span className="pill-dot" style={{ background: `var(--t-${t})` }} />
              {t}s <span className="count">0</span>
            </span>
          ),
        )}
      </nav>

      <section aria-labelledby="plugins-title">
        <h2 id="plugins-title" className="section-title">Plugins</h2>
        <div className="grid">
          {catalog.plugins.map((p) => (
            <Card key={p.id} plugin={p} />
          ))}
        </div>
      </section>

      <section aria-labelledby="releases-title">
        <div className="row row-between" style={{ alignItems: 'baseline' }}>
          <h2 id="releases-title" className="section-title" style={{ marginBottom: 14 }}>Latest releases</h2>
          <a href="#/whats-new" style={{ fontWeight: 600 }}>All releases →</a>
        </div>
        <ReleaseRows releases={catalog.releases.slice(0, 3)} />
      </section>
    </>
  );
}
