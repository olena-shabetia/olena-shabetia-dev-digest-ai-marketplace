import { CodeBlock } from '../components/CodeBlock';
import { useCatalogCtx } from '../components/context';
import { githubUrl } from '../data';

export function GettingStarted() {
  const { catalog } = useCatalogCtx();
  const { repo, name } = catalog.marketplace;
  const example = catalog.plugins.find((p) => p.dependencies.length) ?? catalog.plugins[0];
  const min = catalog.plugins.map((p) => p.minClaudeCodeVersion).filter(Boolean).sort().pop() ?? '2.1.110';
  const steps = [
    { t: 'Check prerequisites', d: `You need Claude Code ${min} or newer.`, code: 'claude --version' },
    { t: 'Add the marketplace', d: 'Once per project or user. Choose project to share it with your team.', code: `claude plugin marketplace add ${repo} --scope project` },
    { t: 'Install a plugin', d: 'Dependencies come along automatically.', code: `claude plugin install ${example?.id ?? 'plugin-name'}@${name} --scope project` },
  ];
  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1 className="page-title">Getting started</h1>
        <p style={{ fontSize: 16 }}>Three steps from nothing to an installed plugin.</p>
      </div>
      <ol className="steps" style={{ maxWidth: 820 }}>
        {steps.map((s, i) => (
          <li key={s.t} className="step">
            <span className="step-n" aria-hidden="true">{i + 1}</span>
            <div className="stack" style={{ gap: 10, minWidth: 0 }}>
              <h2 style={{ fontSize: 24 }}>{s.t}</h2>
              <p style={{ lineHeight: 1.55 }}>{s.d}</p>
              <CodeBlock code={s.code} />
            </div>
          </li>
        ))}
      </ol>
      <section className="note-box" style={{ maxWidth: 820 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Stable channel and rollback</h2>
        <p style={{ lineHeight: 1.55 }}>
          Prefer slower, tested updates? Switch to the stable channel, or pin a previous tag if a release misbehaves. The exact
          references live in{' '}
          <a href={githubUrl(repo, 'docs/RELEASES.md')} target="_blank" rel="noopener noreferrer">docs/RELEASES.md</a>.
        </p>
      </section>
    </>
  );
}
