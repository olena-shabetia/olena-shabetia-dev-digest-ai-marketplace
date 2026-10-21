import { CodeBlock } from '../components/CodeBlock';
import { useCatalogCtx } from '../components/context';
import { githubUrl } from '../data';
import { t } from '../messages';

export function GettingStarted() {
  const { catalog } = useCatalogCtx();
  const { repo, name } = catalog.marketplace;
  const example = catalog.plugins.find((p) => p.dependencies.length) ?? catalog.plugins[0];
  const min = catalog.plugins.map((p) => p.minClaudeCodeVersion).filter(Boolean).sort().pop() ?? '2.1.110';
  const steps = [
    { title: t('gettingStarted.prerequisitesTitle'), body: t('gettingStarted.prerequisitesBody', { min }), code: 'claude --version' },
    { title: t('gettingStarted.addTitle'), body: t('gettingStarted.addBody'), code: `claude plugin marketplace add ${repo} --scope project` },
    { title: t('gettingStarted.installTitle'), body: t('gettingStarted.installBody'), code: `claude plugin install ${example?.id ?? 'plugin-name'}@${name} --scope project` },
  ];
  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1 className="page-title">{t('gettingStarted.title')}</h1>
        <p style={{ fontSize: 16 }}>{t('gettingStarted.subtitle')}</p>
      </div>
      <ol className="steps" style={{ maxWidth: 820 }}>
        {steps.map((s, i) => (
          <li key={s.title} className="step">
            <span className="step-n" aria-hidden="true">{i + 1}</span>
            <div className="stack" style={{ gap: 10, minWidth: 0 }}>
              <h2 style={{ fontSize: 24 }}>{s.title}</h2>
              <p style={{ lineHeight: 1.55 }}>{s.body}</p>
              <CodeBlock code={s.code} />
            </div>
          </li>
        ))}
      </ol>
      <section className="note-box" style={{ maxWidth: 820 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>{t('gettingStarted.noteTitle')}</h2>
        <p style={{ lineHeight: 1.55 }}>
          {t('gettingStarted.noteBefore')}
          <a href={githubUrl(repo, 'docs/RELEASES.md')} target="_blank" rel="noopener noreferrer">docs/RELEASES.md</a>{t('gettingStarted.noteAfter')}
        </p>
      </section>
    </>
  );
}
