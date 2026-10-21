import { CopyButton } from '../components/CopyButton';
import { useCatalogCtx } from '../components/context';
import { Markdown } from '../components/Markdown';
import { SearchBox } from '../components/Header';
import { NotFound } from '../components/States';
import { TypeBadge, displayName } from '../components/TypeBadge';
import { githubUrl } from '../data';
import { artifactHref, pluginHref, type Route } from '../router';

export function ArtifactPage({ route }: { route: Route }) {
  const { catalog } = useCatalogCtx();
  const [, plugin, type, name] = route.segments;
  const artifact = catalog.artifacts.find((a) => a.id === `${plugin}/${type}/${name}`);
  if (!artifact) return <NotFound search={<SearchBox />} />;

  const siblings = catalog.artifacts.filter((a) => a.plugin === artifact.plugin && a.id !== artifact.id);
  const source = githubUrl(catalog.marketplace.repo, artifact.path);
  const title = displayName(artifact.type, artifact.name);
  const install = `claude plugin install ${artifact.plugin}@${catalog.marketplace.name} --scope project`;
  const baseDir = artifact.path.split('/').slice(0, -1).join('/');

  return (
    <div className="layout-aside">
      <div className="stack" style={{ gap: 22, minWidth: 0 }}>
        <div className="breadcrumb">
          <a href={pluginHref(artifact.plugin)}>{artifact.plugin}</a> / {artifact.type} / <span className="mono">{title}</span>
        </div>
        <header className="stack" style={{ gap: 12 }}>
          <div className="row">
            <TypeBadge type={artifact.type} />
            <span style={{ fontSize: 14 }}>
              in <a className="mono" href={pluginHref(artifact.plugin)}>{artifact.plugin}</a>
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 'clamp(26px, 5vw, 38px)', overflowWrap: 'anywhere' }}>{title}</h1>
          {artifact.description && <p className="lead">{artifact.description}</p>}
          {artifact.tools.length > 0 && (
            <div className="chips">
              <span style={{ fontSize: 13 }}>Tools</span>
              {artifact.tools.map((t) => <span key={t} className="tool">{t}</span>)}
            </div>
          )}
          <div className="row" style={{ gap: 10 }}>
            <CopyButton text={install} label="Copy plugin install command" className="btn btn-primary" />
            <CopyButton text={artifact.body} label={artifact.bodyTruncated ? 'Copy file contents (truncated)' : 'Copy file contents'} className="btn btn-secondary" />
            <a className="btn btn-ghost" href={source} target="_blank" rel="noopener noreferrer">View on GitHub ↗</a>
          </div>
        </header>
        <Markdown
          boxed
          source={artifact.body || '_This file has no body._'}
          baseDir={baseDir}
          anchorBase={artifactHref(artifact.plugin, artifact.type, artifact.name)}
          scrollTo={route.query.get('h')}
        />
        {artifact.bodyTruncated && (
          <p className="muted" style={{ fontSize: 13 }}>
            Body truncated in the index — <a href={source} target="_blank" rel="noopener noreferrer">view the full file on GitHub</a>.
          </p>
        )}
      </div>
      {siblings.length > 0 && (
        <aside aria-label="Same plugin" className="stack sticky" style={{ gap: 12 }}>
          <h2 style={{ fontSize: 22 }}>Same plugin</h2>
          {siblings.map((s) => (
            <a key={s.id} className="sibling" href={artifactHref(s.plugin, s.type, s.name)}>
              <TypeBadge type={s.type} />
              <span className="mono">{displayName(s.type, s.name)}</span>
            </a>
          ))}
        </aside>
      )}
    </div>
  );
}

