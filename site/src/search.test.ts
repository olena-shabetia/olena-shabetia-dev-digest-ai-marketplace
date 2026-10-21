import { describe, expect, it } from 'vitest';
import { catalog } from './fixtures';
import { buildSearchIndex, facetCounts, highlight, parseQuery, search, snippet, stem } from './search';

const index = buildSearchIndex(catalog);
const none = { types: [], plugins: [] };

describe('parseQuery', () => {
  it('drops stop words and turns type words into a type filter', () => {
    expect(parseQuery('I need a skill for reviewing architecture')).toEqual({
      terms: ['reviewing', 'architecture'],
      types: ['skill'],
    });
  });

  it('understands plurals and several types', () => {
    expect(parseQuery('skills and agents').types).toEqual(['skill', 'agent']);
  });

  it('keeps hyphenated names as one term', () => {
    expect(parseQuery('write-spec').terms).toEqual(['write-spec']);
  });
});

describe('stem', () => {
  it('maps inflections to one stem', () => {
    expect(new Set(['review', 'reviews', 'reviewing', 'reviewed'].map(stem)).size).toBe(1);
    expect(stem('uses')).toBe('use');
    expect(stem('sdd')).toBe('sdd');
  });
});

describe('search', () => {
  it('finds architecture content for "skill architecture review" and infers the skill type', () => {
    const r = search(index, 'skill architecture review', none);
    expect(r.inferredTypes).toEqual(['skill']);
    expect(r.hits.every((h) => h.kind === 'artifact' && h.item.type === 'skill')).toBe(true);
    expect(r.hits[0].kind === 'artifact' && r.hits[0].item.name).toBe('architecture-review');
  });

  it('matches inflected words and prefixes', () => {
    const r = search(index, 'reviewing', none);
    expect(r.hits.map((h) => (h.kind === 'artifact' ? h.item.name : ''))).toContain('reviewer');
  });

  it('lists everything of the type when only stop words and a type remain', () => {
    const r = search(index, 'I need a skill', none);
    expect(r.hits.map((h) => (h.kind === 'artifact' ? h.item.name : '')).sort()).toEqual(['architecture-review', 'write-spec']);
  });

  it('returns nothing for an empty or stop-word-only query', () => {
    expect(search(index, '', none).hits).toEqual([]);
    expect(search(index, 'I need a', none).hits).toEqual([]);
  });

  it('lets explicit type chips override the inferred type', () => {
    const r = search(index, 'skill review', { types: ['agent'], plugins: [] });
    expect(r.appliedTypes).toEqual(['agent']);
    expect(r.hits.every((h) => h.kind === 'artifact' && h.item.type === 'agent')).toBe(true);
  });

  it('filters by plugin', () => {
    const r = search(index, 'spec', { types: [], plugins: ['sdd'] });
    expect(r.hits.every((h) => (h.kind === 'plugin' ? h.item.id : h.kind === 'artifact' ? h.item.plugin : '') === 'sdd')).toBe(true);
  });

  it('ranks a name match above a body-only match', () => {
    const r = search(index, 'architecture', none);
    expect(r.hits[0].kind === 'artifact' && r.hits[0].item.name).toBe('architecture-review');
  });

  it('includes docs only when no type is applied', () => {
    expect(search(index, 'release', none).hits.some((h) => h.kind === 'doc')).toBe(true);
    expect(search(index, 'release', { types: ['skill'], plugins: [] }).hits.some((h) => h.kind === 'doc')).toBe(false);
  });

  it('counts facets', () => {
    const c = facetCounts(index, 'review', none);
    expect(c.types.skill).toBeGreaterThan(0);
    expect(c.plugins.base).toBeGreaterThan(0);
  });
});

describe('highlight and snippet', () => {
  it('marks words that start with a stemmed term', () => {
    expect(highlight('Review the architecture', ['reviewing'])).toEqual([
      { text: 'Review', match: true },
      { text: ' the architecture', match: false },
    ]);
  });

  it('returns the description when it already matches', () => {
    expect(snippet('Review things', 'body', ['review'])).toBe('Review things');
  });

  it('falls back to a body excerpt when only the body matches', () => {
    const out = snippet('Interview the user.', 'Ask about goals. Afterwards the architecture is documented.', ['architecture']);
    expect(out).toContain('architecture');
  });
});
