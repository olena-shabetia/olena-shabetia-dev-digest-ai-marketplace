import { useEffect, useState } from 'react';
import { buildSearchIndex, type SearchIndex } from './search';
import type { Catalog } from './types';

export type CatalogState =
  | { status: 'loading' }
  | { status: 'error'; message: string; retry: () => void }
  | { status: 'ready'; catalog: Catalog; index: SearchIndex };

/** Loads index.json once; the URL is relative so it works under any Pages sub-path. */
export function useCatalog(): CatalogState {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<CatalogState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetch(`${import.meta.env.BASE_URL}index.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Catalog>;
      })
      .then((catalog) => {
        if (!cancelled) setState({ status: 'ready', catalog, index: buildSearchIndex(catalog) });
      })
      .catch((e: Error) => {
        if (!cancelled) setState({ status: 'error', message: e.message, retry: () => setAttempt((n) => n + 1) });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return state;
}

export const githubUrl = (repo: string, path = '') => `https://github.com/${repo}${path ? `/blob/main/${path}` : ''}`;
export const githubTree = (repo: string, path: string) => `https://github.com/${repo}/tree/main/${path}`;
