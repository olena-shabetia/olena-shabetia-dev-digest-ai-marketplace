import MiniSearch from 'minisearch';
import { ITEM_TYPES, type Artifact, type Catalog, type Doc, type ItemType, type Plugin } from './types';

const STOP_WORDS = new Set(
  `a about all am an and any are as at be been but by can could do does for from get had has have how i i'd i'll i'm i've if in into is it its just like me my need needs of on one or our please should so some something that the their them then there these they this to up us use using want wants was we were what when where which who why will with would you your`.split(
    /\s+/,
  ),
);

const TYPE_WORDS: Record<string, ItemType> = {};
for (const t of ITEM_TYPES) {
  TYPE_WORDS[t] = t;
  TYPE_WORDS[`${t}s`] = t;
}

/** Light suffix stemmer: reviewing / reviews / reviewed -> review. Used for index and query alike. */
export function stem(raw: string): string {
  const t = raw.toLowerCase();
  for (const suffix of ['ing', 'ed', 'es', 's']) {
    if (t.endsWith(suffix) && t.length - suffix.length >= 3) return t.slice(0, -suffix.length);
  }
  return t;
}

const tokenize = (text: string) => text.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];

export interface ParsedQuery {
  terms: string[];
  types: ItemType[];
}

export function parseQuery(query: string): ParsedQuery {
  const terms: string[] = [];
  const types: ItemType[] = [];
  for (const word of tokenize(query)) {
    if (word in TYPE_WORDS) {
      if (!types.includes(TYPE_WORDS[word])) types.push(TYPE_WORDS[word]);
    } else if (!STOP_WORDS.has(word)) {
      terms.push(word);
    }
  }
  return { terms, types };
}

export type Hit =
  | { kind: 'plugin'; item: Plugin; score: number }
  | { kind: 'artifact'; item: Artifact; score: number }
  | { kind: 'doc'; item: Doc; score: number };

export interface Filters {
  types: ItemType[];
  plugins: string[];
}

export interface SearchResult {
  hits: Hit[];
  terms: string[];
  /** Types inferred from the phrase; ignored when explicit type filters are set. */
  inferredTypes: ItemType[];
  /** Types actually applied. */
  appliedTypes: ItemType[];
}

interface IndexDoc {
  id: string;
  name: string;
  description: string;
  plugin: string;
  tools: string;
  body: string;
}

export interface SearchIndex {
  catalog: Catalog;
  mini: MiniSearch<IndexDoc>;
  lookup: Map<string, Hit>;
}

const FIELD_WEIGHTS = { name: 5, description: 3, plugin: 2, tools: 1.5, body: 1 };
const TYPE_ORDER: Record<string, number> = { plugin: 0, skill: 1, agent: 2, command: 3, hook: 4, doc: 5 };

export function buildSearchIndex(catalog: Catalog): SearchIndex {
  const mini = new MiniSearch<IndexDoc>({
    fields: Object.keys(FIELD_WEIGHTS),
    storeFields: [],
    tokenize,
    processTerm: (term) => (STOP_WORDS.has(term) ? null : stem(term)),
  });
  const lookup = new Map<string, Hit>();
  const docs: IndexDoc[] = [];

  for (const p of catalog.plugins) {
    const id = `plugin:${p.id}`;
    lookup.set(id, { kind: 'plugin', item: p, score: 0 });
    docs.push({ id, name: p.id, description: p.description, plugin: '', tools: '', body: p.readme });
  }
  for (const a of catalog.artifacts) {
    const id = `artifact:${a.id}`;
    lookup.set(id, { kind: 'artifact', item: a, score: 0 });
    docs.push({ id, name: a.name, description: a.description, plugin: a.plugin, tools: a.tools.join(' '), body: a.body });
  }
  for (const d of catalog.docs) {
    const id = `doc:${d.id}`;
    lookup.set(id, { kind: 'doc', item: d, score: 0 });
    docs.push({ id, name: d.title, description: '', plugin: '', tools: '', body: d.body });
  }
  mini.addAll(docs);
  return { catalog, mini, lookup };
}

const typeOf = (h: Hit): string => (h.kind === 'plugin' ? 'plugin' : h.kind === 'artifact' ? h.item.type : 'doc');
const nameOf = (h: Hit): string => (h.kind === 'doc' ? h.item.title : h.kind === 'plugin' ? h.item.id : h.item.name);
const pluginOf = (h: Hit): string => (h.kind === 'plugin' ? h.item.id : h.kind === 'artifact' ? h.item.plugin : '');

export function search(index: SearchIndex, query: string, filters: Filters): SearchResult {
  const { terms, types: inferredTypes } = parseQuery(query);
  const appliedTypes = filters.types.length ? filters.types : inferredTypes;

  let hits: Hit[];
  if (terms.length) {
    const results = index.mini.search(terms.join(' '), {
      boost: FIELD_WEIGHTS,
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'OR',
    });
    hits = results.flatMap((r) => {
      const hit = index.lookup.get(r.id);
      if (!hit) return [];
      // documents matching more of the query terms rank higher
      return [{ ...hit, score: r.score * (1 + 0.5 * (new Set(r.queryTerms).size - 1)) } as Hit];
    });
  } else if (appliedTypes.length) {
    // "I need a skill": no keywords left, list everything of that type
    hits = [...index.lookup.values()].filter((h) => h.kind !== 'doc');
  } else {
    hits = [];
  }

  hits = hits.filter((h) => {
    if (appliedTypes.length && !appliedTypes.includes(typeOf(h) as ItemType)) return false;
    if (filters.plugins.length && !filters.plugins.includes(pluginOf(h))) return false;
    return true;
  });

  hits.sort(
    (a, b) =>
      b.score - a.score ||
      TYPE_ORDER[typeOf(a)] - TYPE_ORDER[typeOf(b)] ||
      nameOf(a).localeCompare(nameOf(b)),
  );
  return { hits, terms, inferredTypes, appliedTypes };
}

/** Counts per type and per plugin for the filter sidebar (type filters ignored for type counts). */
export function facetCounts(index: SearchIndex, query: string, filters: Filters) {
  const base = search(index, query, { types: [], plugins: filters.plugins }).hits;
  const forPlugins = search(index, query, { types: filters.types, plugins: [] }).hits;
  const types: Record<string, number> = {};
  for (const t of ITEM_TYPES) types[t] = 0;
  for (const h of base) {
    const t = typeOf(h);
    if (t in types) types[t]++;
  }
  const plugins: Record<string, number> = {};
  for (const h of forPlugins) {
    const p = pluginOf(h);
    if (p) plugins[p] = (plugins[p] ?? 0) + 1;
  }
  return { types, plugins };
}

export interface Segment {
  text: string;
  match: boolean;
}

/** Split text into segments, marking words that start with a (stemmed) search term. */
export function highlight(text: string, terms: string[]): Segment[] {
  const stems = [...new Set(terms.map(stem))].filter((t) => t.length > 1);
  if (!stems.length) return [{ text, match: false }];
  const re = new RegExp(`(${stems.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})[a-z0-9]*`, 'gi');
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), match: false });
    out.push({ text: m[0], match: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), match: false });
  return out;
}

const plain = (md: string) =>
  md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[`*_>#]|\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

/** The description, or a ~160 character excerpt of the body when the match is only there. */
export function snippet(description: string, body: string, terms: string[]): string {
  const hasMatch = (s: string) => highlight(s, terms).some((x) => x.match);
  if (!terms.length || hasMatch(description)) return description;
  const text = plain(body);
  const m = highlight(text, terms).reduce<{ at: number; found: boolean }>(
    (acc, seg) => (acc.found ? acc : seg.match ? { at: acc.at, found: true } : { at: acc.at + seg.text.length, found: false }),
    { at: 0, found: false },
  );
  if (!m.found) return description;
  const start = Math.max(0, m.at - 60);
  const excerpt = text.slice(start, start + 160).trim();
  return `${start > 0 ? '…' : ''}${excerpt}${start + 160 < text.length ? '…' : ''}`;
}

