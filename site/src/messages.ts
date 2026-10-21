/**
 * Every piece of user-visible text in the catalog lives in this file: labels, headings, placeholders,
 * aria-labels, empty states and page titles. Components read them through `t()`, `tl()` and never
 * contain literal UI copy (src/messages.test.ts enforces this).
 *
 * Conventions
 * - `{name}` is replaced by the matching variable passed to `t(key, { name })`.
 * - An object with `one` and `other` is a plural; call `t(key, { count })`.
 * - Text that wraps a link or inline code is split into `...Before` / `...After` parts, so the
 *   component keeps the markup and this file keeps the words.
 * - Shell commands, CLI flag values (`project`, `latest`, ...) and identifiers are not copy and stay in code.
 *
 * To add a language: copy `en`, translate the values, and point `messages` below at the new object.
 * `index.html` holds the static <title> and meta tags shown before the app loads; keep them in sync by hand.
 */
export const en = {
  meta: {
    locale: 'en-US',
  },
  app: {
    site: 'dev-digest marketplace',
    brand: 'dev-digest',
    defaultDescription:
      'Search Claude Code plugins, skills, agents, commands and hooks from the dev-digest marketplace and install them in one line.',
    skipLink: 'Skip to content',
  },
  title: {
    home: '{site} — find a Claude Code plugin',
    search: 'Search · {site}',
    searchQuery: '“{q}” — search · {site}',
    plugin: '{name} · {site}',
    artifact: '{name} ({type}) · {plugin} · {site}',
    install: 'Install builder · {site}',
    whatsNew: "What's new · {site}",
    gettingStarted: 'Getting started · {site}',
    notFound: 'Not found · {site}',
  },
  footer: {
    builtFrom: 'Catalog built {date} from',
    builtFromNoDate: 'Built from',
    repoFallback: 'the marketplace repository',
    design: 'Design mockups',
  },
  nav: {
    aria: 'Main',
    plugins: 'Plugins',
    pluginsShort: 'Plugins',
    install: 'Install',
    installShort: 'Install',
    whatsNew: "What's new",
    whatsNewShort: 'New',
    gettingStarted: 'Getting started',
    gettingStartedShort: 'Start',
    github: 'GitHub repository',
    githubShort: 'GH',
    switchTheme: 'Switch to {theme} theme',
    themeLight: 'light',
    themeDark: 'dark',
  },
  search: {
    headerLabel: 'Search catalog',
    headerPlaceholder: 'Search plugins, skills, agents…',
    boxLabel: 'Search',
    boxPlaceholder: 'Search {count} plugins, skills, agents…',
    filtersAria: 'Filters',
    typeLegend: 'Type',
    pluginLegend: 'Plugin',
    title: 'Results for “{q}”',
    titleEmpty: 'Search the catalog',
    results: { one: '{count} result', other: '{count} results' },
    typeInferred: ' · type inferred from your phrase',
    termsUsedInline: ' · terms used: ',
    chipType: 'Type: {value}',
    chipPlugin: 'Plugin: {value}',
    removeFilter: 'Remove filter {label}',
    docsTitle: 'Documentation',
    emptyPrompt: 'Type what you need in the search box, for example:',
    noResultsFor: 'No results for ‘{q}’',
    nothingMatches: 'Nothing matches these filters',
    termsUsed: 'Terms used:',
    tipFewerWords: 'Try fewer or more general words.',
    tipRemoveFilter: 'Remove a type or plugin filter.',
    tipSpelling: 'Check the spelling — matching is forgiving, but not magic.',
    browseAll: 'Browse all plugins',
    suggest: 'Suggest a skill ↗',
    suggestNote: '“Suggest a skill” opens a prefilled GitHub issue with your query.',
    suggestionTitle: 'Suggestion: {q}',
  },
  types: {
    singular: { plugin: 'plugin', skill: 'skill', agent: 'agent', command: 'command', hook: 'hook' },
    plural: { plugin: 'plugins', skill: 'skills', agent: 'agents', command: 'commands', hook: 'hooks' },
    count: {
      skill: { one: '{count} skill', other: '{count} skills' },
      agent: { one: '{count} agent', other: '{count} agents' },
      command: { one: '{count} command', other: '{count} commands' },
      hook: { one: '{count} hook', other: '{count} hooks' },
    },
  },
  card: {
    version: 'v{version}',
    inPlugin: 'in {plugin}',
    copyInstall: 'Copy install command',
    source: 'Source ↗',
  },
  copy: {
    label: 'Copy',
    copied: 'Copied ✓',
    failed: 'Select and copy',
    srCopied: 'Copied to clipboard',
    srFailed: 'Copy failed, the text is selected',
  },
  states: {
    loadingAria: 'Loading the catalog',
    errorTitle: "The catalog couldn't load",
    errorBodyBefore: "We couldn't fetch ",
    errorBodyAfter: ' ({message}). Check your connection and try again — nothing is wrong with your setup.',
    retry: 'Retry',
    openGithub: 'Open on GitHub ↗',
    notFoundCode: '404',
    notFoundTitle: "That page isn't in the catalog",
    notFoundBody: 'The link may be old, or the plugin was renamed. Search for what you need instead.',
    backHome: 'Back to home',
  },
  depGraph: {
    summary: '{id} requires {requires}; required by {requiredBy}',
    nothing: 'nothing',
    noPlugin: 'no plugin',
  },
  home: {
    heroTitle: 'Find a Claude Code plugin by describing the task.',
    heroLead: 'Skills, agents, commands and hooks from the dev-digest marketplace — searchable, with a one-line install.',
    searchLabel: 'Search the catalog',
    searchPlaceholder: 'I need a skill for reviewing architecture',
    try: 'Try',
    browseAria: 'Browse by type',
    all: 'All',
    pluginsTitle: 'Plugins',
    latestReleases: 'Latest releases',
    allReleases: 'All releases →',
  },
  plugin: {
    breadcrumb: 'Plugins',
    minClaudeCode: 'min Claude Code {version}',
    onGithub: '{path} on GitHub ↗',
    installTitle: 'Install',
    scope: 'Scope',
    channel: 'Channel',
    stepAdd: '1 · Add the marketplace (once)',
    stepInstall: '2 · Install the plugin',
    alsoInstalls: { one: 'Also installs {count} dependency:', other: 'Also installs {count} dependencies:' },
    buildCustom: 'Build a custom set →',
    tabsAria: 'Plugin sections',
    tabs: { overview: 'Overview', contents: 'Contents', dependencies: 'Dependencies', changelog: 'Changelog' },
    noReadme: 'This plugin has no README yet.',
    contentsTitle: 'Contents',
    contentsEmpty: 'No skills, agents, commands or hooks yet — this plugin is a placeholder.',
    dependenciesTitle: 'Dependencies',
    requires: 'Requires',
    requiredBy: 'Required by',
    noDependencies: 'This plugin has no dependencies.',
    noDependents: 'No other plugin depends on this one.',
    changelogTitle: 'Changelog',
    noChangelog: 'No releases documented yet.',
  },
  artifact: {
    inPrefix: 'in',
    tools: 'Tools',
    copyInstall: 'Copy plugin install command',
    copyFile: 'Copy file contents',
    copyFileTruncated: 'Copy file contents (truncated)',
    viewOnGithub: 'View on GitHub ↗',
    noBody: '_This file has no body._',
    truncatedBefore: 'Body truncated in the index — ',
    truncatedLink: 'view the full file on GitHub',
    truncatedAfter: '.',
    siblings: 'Same plugin',
  },
  installPage: {
    title: 'Install builder',
    intro: 'Tick what you need. Dependencies are added for you, and the selection lives in the URL so you can share it.',
    pluginsLegend: 'Plugins',
    requiredBy: 'required by {list}',
    selected: 'selected',
    scriptTitle: 'Your script',
    selectOne: 'Select at least one plugin to add install lines.',
    copyScript: 'Copy script',
    scope: 'Scope',
    channel: 'Channel',
  },
  script: {
    marketplace: '# 1 marketplace',
    dependencies: '# 2 dependencies first',
    selected: '# {n} selected',
  },
  whatsNew: {
    title: "What's new",
    subtitle: 'Every tagged release, newest first.',
    feed: 'Atom feed · feed.xml',
    filterAria: 'Filter by plugin',
    allPlugins: 'All plugins',
    undated: 'Undated',
    none: 'No tagged releases yet.',
    emptyBefore: 'No tagged releases yet. Releases appear here once a ',
    emptyAfter: ' tag is pushed.',
    tag: 'Tag {tag} ↗',
  },
  gettingStarted: {
    title: 'Getting started',
    subtitle: 'Three steps from nothing to an installed plugin.',
    prerequisitesTitle: 'Check prerequisites',
    prerequisitesBody: 'You need Claude Code {min} or newer.',
    addTitle: 'Add the marketplace',
    addBody: 'Once per project or user. Choose project to share it with your team.',
    installTitle: 'Install a plugin',
    installBody: 'Dependencies come along automatically.',
    noteTitle: 'Stable channel and rollback',
    noteBefore:
      'Prefer slower, tested updates? Switch to the stable channel, or pin a previous tag if a release misbehaves. The exact references live in ',
    noteAfter: '.',
  },
} as const;

/** Lists of example queries, kept apart from `en` because they are arrays, not strings. */
export const lists = {
  homeExamples: ['review architecture', 'agent for code review', 'write a spec', 'commit hooks'],
  searchExamples: ['review architecture', 'agent for code review', 'write a spec'],
} as const;

type Plural = { readonly other: string };
type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : T[K] extends Plural ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];

export type MessageKey = Paths<typeof en>;
export type ListKey = keyof typeof lists;
export type Vars = Record<string, string | number>;

/** The active dictionary. Swapping languages means pointing this at another object of the same shape. */
export const messages: typeof en = en;

function lookup(key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages);
}

/** Resolves `key` (a plural when `vars.count` is given) and fills in `{name}` placeholders. */
export function t(key: MessageKey, vars?: Vars): string {
  let node = lookup(key);
  if (node && typeof node === 'object') {
    const forms = node as Record<string, string>;
    const rule = new Intl.PluralRules(messages.meta.locale).select(Number(vars?.count ?? 0));
    node = forms[rule] ?? forms.other;
  }
  if (typeof node !== 'string') return key;
  return node.replace(/\{(\w+)\}/g, (whole, name: string) => (vars && name in vars ? String(vars[name]) : whole));
}

export function tl(key: ListKey): readonly string[] {
  return lists[key];
}
