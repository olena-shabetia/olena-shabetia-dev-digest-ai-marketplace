import { githubUrl } from '../data';
import { artifactHref, pluginHref } from '../router';
import { t } from '../messages';
import { highlight, snippet } from '../search';
import type { Artifact, Plugin } from '../types';
import { useCatalogCtx } from './context';
import { CopyButton } from './CopyButton';
import { TypeBadge, displayName } from './TypeBadge';

export function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {highlight(text, terms).map((s, i) => (s.match ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>))}
    </>
  );
}

interface Props {
  plugin?: Plugin;
  artifact?: Artifact;
  terms?: string[];
}

/** Card for a plugin or an artifact. The whole card is the link; the buttons sit above it. */
export function Card({ plugin, artifact, terms = [] }: Props) {
  const { catalog } = useCatalogCtx();
  const { repo, name: marketplace } = catalog.marketplace;
  const pluginId = plugin?.id ?? artifact?.plugin ?? '';
  const type = plugin ? 'plugin' : artifact!.type;
  const title = plugin ? plugin.id : displayName(artifact!.type, artifact!.name);
  const description = plugin
    ? snippet(plugin.description, plugin.readme, terms)
    : snippet(artifact!.description, artifact!.body, terms);
  const to = plugin ? pluginHref(plugin.id) : artifactHref(artifact!.plugin, artifact!.type, artifact!.name);
  const source = githubUrl(repo, plugin ? plugin.path : artifact!.path);

  return (
    <article className="card">
      <div className="card-head">
        <TypeBadge type={type} />
        <span className="card-meta">{plugin ? t('card.version', { version: plugin.version }) : t('card.inPlugin', { plugin: artifact!.plugin })}</span>
      </div>
      <a className="card-title" href={to}>
        {title}
      </a>
      <p className="card-desc">
        <Highlighted text={description} terms={terms} />
      </p>
      <div className="card-foot">
        <CopyButton
          text={`claude plugin install ${pluginId}@${marketplace} --scope project`}
          label={t('card.copyInstall')}
        />
        <a className="btn btn-ghost btn-sm" href={source} target="_blank" rel="noopener noreferrer">
          {t('card.source')}
        </a>
      </div>
    </article>
  );
}
