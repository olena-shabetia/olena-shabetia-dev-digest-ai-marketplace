import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useEffect, useMemo, useRef } from 'react';
import { useCatalogCtx } from './context';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || 'section';

interface Options {
  repo: string;
  /** Repository directory of the file, used to resolve relative links. */
  baseDir: string;
  /** Route the anchors point back to, e.g. "#/plugin/foo". */
  anchorBase: string;
}

function render(source: string, { repo, baseDir, anchorBase }: Options): string {
  const raw = marked.parse(source, { async: false, gfm: true }) as string;
  // Images are dropped: the catalog makes no requests to third-party origins.
  const clean = DOMPurify.sanitize(raw, { FORBID_TAGS: ['img', 'style', 'form', 'input', 'button', 'iframe'] });
  const tpl = document.createElement('template');
  tpl.innerHTML = clean;

  const seen = new Map<string, number>();
  tpl.content.querySelectorAll('h1,h2,h3,h4').forEach((h) => {
    const base = slugify(h.textContent ?? '');
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    const id = n ? `${base}-${n}` : base;
    h.id = id;
    const a = document.createElement('a');
    a.className = 'anchor';
    a.href = `${anchorBase}?h=${id}`;
    a.setAttribute('aria-label', `Link to ${h.textContent ?? 'section'}`);
    a.textContent = '#';
    h.appendChild(a);
  });

  const root = `https://github.com/${repo}/blob/main/`;
  tpl.content.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') ?? '';
    if (a.classList.contains('anchor')) return;
    if (href.startsWith('#')) {
      a.setAttribute('href', `${anchorBase}?h=${encodeURIComponent(href.slice(1))}`);
    } else if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    } else {
      const abs = href.startsWith('/') ? new URL(href.slice(1), root) : new URL(href, `${root}${baseDir ? `${baseDir}/` : ''}`);
      a.setAttribute('href', abs.href);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });
  return tpl.innerHTML;
}

interface Props {
  source: string;
  baseDir: string;
  anchorBase: string;
  scrollTo?: string | null;
  boxed?: boolean;
}

export function Markdown({ source, baseDir, anchorBase, scrollTo, boxed }: Props) {
  const { catalog } = useCatalogCtx();
  const html = useMemo(
    () => render(source, { repo: catalog.marketplace.repo, baseDir, anchorBase }),
    [source, baseDir, anchorBase, catalog.marketplace.repo],
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollTo || !ref.current) return;
    ref.current.querySelector<HTMLElement>(`[id="${CSS.escape(scrollTo)}"]`)?.scrollIntoView({ block: 'start' });
  }, [html, scrollTo]);

  return <div ref={ref} className={`md${boxed ? ' boxed' : ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
