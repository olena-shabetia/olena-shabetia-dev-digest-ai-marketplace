import { useSyncExternalStore } from 'react';

export interface Route {
  segments: string[];
  query: URLSearchParams;
  /** Hash without the query string, e.g. "#/plugin/foo". */
  base: string;
}

const EVENT = 'routechange';

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener('hashchange', cb);
    window.removeEventListener(EVENT, cb);
  };
}

const snapshot = () => window.location.hash;

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const segments = path.split('/').filter(Boolean).map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
  return { segments, query: new URLSearchParams(query), base: '#/' + path };
}

export function useHash(): string {
  return useSyncExternalStore(subscribe, snapshot, () => '');
}

export function href(path: string, params?: Record<string, string | string[] | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (Array.isArray(v)) {
      if (v.length) q.set(k, v.join(','));
    } else if (v) q.set(k, v);
  }
  const s = q.toString();
  return `#${path}${s ? `?${s}` : ''}`;
}

/** Change the URL. `replace` updates it without adding a history entry. */
export function navigate(to: string, replace = false) {
  if (to === window.location.hash) return;
  if (replace) {
    window.history.replaceState(null, '', to);
    window.dispatchEvent(new Event(EVENT));
  } else {
    window.location.hash = to;
  }
}

export const artifactHref = (plugin: string, type: string, name: string) =>
  `#/artifact/${[plugin, type, name].map(encodeURIComponent).join('/')}`;
export const pluginHref = (name: string) => `#/plugin/${encodeURIComponent(name)}`;
