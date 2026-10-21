import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { en, lists, t } from './messages';

/** Every component source, read as raw text so no Node typings are needed. */
const SOURCES = import.meta.glob<string>('./**/*.tsx', { query: '?raw', import: 'default', eager: true });

/** Text that is a command, a file name or an identifier rather than copy, so it stays in the component. */
const NOT_COPY = new Set(['$ claude plugin install', 'index.json', 'docs/RELEASES.md', '&lt;plugin&gt;--v&lt;version&gt;']);
const COPY_ATTRIBUTES = new Set(['placeholder', 'aria-label', 'title', 'alt', 'label']);
const hasWords = (text: string) => /[A-Za-z]{2,}/.test(text);

/** Literal text a JSX expression can render directly: `{'text'}`, `{ok && 'text'}`, `{ok ? 'a' : 'b'}`. */
function renderedLiterals(node: ts.Node, out: string[]): void {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) out.push(node.text);
  else if (ts.isTemplateExpression(node)) out.push(node.head.text, ...node.templateSpans.map((s) => s.literal.text));
  else if (ts.isParenthesizedExpression(node)) renderedLiterals(node.expression, out);
  else if (ts.isConditionalExpression(node)) {
    renderedLiterals(node.whenTrue, out);
    renderedLiterals(node.whenFalse, out);
  } else if (ts.isBinaryExpression(node) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind)) {
    renderedLiterals(node.right, out);
  }
}

function hardcodedCopy(file: string, text: string): string[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) found.push(node.text);
    else if (ts.isJsxAttribute(node) && node.initializer && COPY_ATTRIBUTES.has(node.name.getText()) && ts.isStringLiteral(node.initializer)) found.push(node.initializer.text);
    else if (ts.isJsxExpression(node) && node.expression && !(node.parent && ts.isJsxAttribute(node.parent))) renderedLiterals(node.expression, found);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found.map((text) => text.replace(/\s+/g, ' ').trim()).filter((text) => hasWords(text) && !NOT_COPY.has(text));
}

describe('UI copy lives in messages.ts', () => {
  it('scans the component sources', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(10);
  });

  for (const [file, text] of Object.entries(SOURCES)) {
    it(`${file} has no hardcoded text`, () => {
      expect(hardcodedCopy(file, text)).toEqual([]);
    });
  }
});

describe('t()', () => {
  it('fills placeholders', () => {
    expect(t('nav.switchTheme', { theme: 'dark' })).toBe('Switch to dark theme');
  });

  it('picks the plural form from count', () => {
    expect(t('search.results', { count: 1 })).toBe('1 result');
    expect(t('search.results', { count: 3 })).toBe('3 results');
    expect(t('plugin.alsoInstalls', { count: 1 })).toBe('Also installs 1 dependency:');
  });

  it('leaves unknown placeholders visible instead of dropping them', () => {
    expect(t('title.plugin', { name: 'x' })).toBe('x · {site}');
  });
});

describe('dictionary shape', () => {
  const strings = (node: unknown, path = ''): string[] =>
    typeof node === 'string'
      ? [path]
      : Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));

  it('has no empty messages', () => {
    for (const key of strings(en)) expect(t(key as never).length, key).toBeGreaterThan(0);
  });

  it('keeps example queries non-empty', () => {
    expect(lists.homeExamples.length).toBeGreaterThan(0);
    expect(lists.searchExamples.length).toBeGreaterThan(0);
  });
});
