import type { ReactNode } from 'react';

export function CardSkeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-2" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skel-card">
          <div className="skel" style={{ height: 22, width: 70, borderRadius: 999 }} />
          <div className="skel" style={{ height: 18, width: '55%' }} />
          <div className="skel" style={{ height: 12 }} />
          <div className="skel" style={{ height: 12, width: '80%' }} />
          <div className="skel" style={{ height: 30, width: '60%', borderRadius: 999, marginTop: 6 }} />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="stack" aria-busy="true" aria-label="Loading the catalog" role="status">
      <div className="skel" style={{ height: 34, width: '60%' }} />
      <div className="skel" style={{ height: 14, width: '30%', borderRadius: 8 }} />
      <CardSkeletons />
    </div>
  );
}

export function ErrorState({ message, onRetry, repo }: { message: string; onRetry: () => void; repo?: string }) {
  return (
    <div className="state" role="alert">
      <span className="icon" aria-hidden="true">!</span>
      <h1 className="page-title">The catalog couldn&apos;t load</h1>
      <p>
        We couldn&apos;t fetch <code>index.json</code> ({message}). Check your connection and try again — nothing is wrong with
        your setup.
      </p>
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Retry
        </button>
        {repo && (
          <a className="btn btn-secondary" href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer">
            Open on GitHub ↗
          </a>
        )}
      </div>
    </div>
  );
}

export function NotFound({ search }: { search: ReactNode }) {
  return (
    <div className="state">
      <div className="big" aria-hidden="true">404</div>
      <h1 className="page-title">That page isn&apos;t in the catalog</h1>
      <p>The link may be old, or the plugin was renamed. Search for what you need instead.</p>
      {search}
      <a className="btn btn-primary" href="#/">
        Back to home
      </a>
    </div>
  );
}
