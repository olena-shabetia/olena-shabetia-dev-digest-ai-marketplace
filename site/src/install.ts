import type { Catalog, Channel, Plugin, Scope } from './types';

/**
 * Expand a selection with its dependencies, dependencies first.
 * `requiredBy` maps a pulled-in plugin to the selected plugins that need it.
 */
export function resolveSelection(selected: string[], plugins: Plugin[]) {
  const byId = new Map(plugins.map((p) => [p.id, p]));
  const ordered: string[] = [];
  const visiting = new Set<string>();
  const requiredBy = new Map<string, Set<string>>();

  const visit = (id: string, root: string) => {
    const p = byId.get(id);
    if (!p || visiting.has(id)) return;
    visiting.add(id);
    for (const d of p.dependencies) {
      if (!byId.has(d.name)) continue;
      if (!selected.includes(d.name)) {
        if (!requiredBy.has(d.name)) requiredBy.set(d.name, new Set());
        requiredBy.get(d.name)!.add(root);
      }
      visit(d.name, root);
    }
    visiting.delete(id);
    if (!ordered.includes(id)) ordered.push(id);
  };

  for (const id of selected) visit(id, id);
  return { ordered, requiredBy: new Map([...requiredBy].map(([k, v]) => [k, [...v]])) };
}

export interface Commands {
  add: string;
  installs: string[];
}

/** Marketplace registration plus one install line per plugin, dependencies first. */
export function buildCommands(catalog: Catalog, selected: string[], scope: Scope, channel: Channel): Commands {
  const { marketplace } = catalog;
  const stable = channel === 'stable';
  const source = stable ? marketplace.stable.ref : marketplace.repo;
  const target = stable ? marketplace.stable.name : marketplace.name;
  const { ordered } = resolveSelection(selected, catalog.plugins);
  return {
    add: `claude plugin marketplace add ${source} --scope ${scope}`,
    installs: ordered.map((id) => `claude plugin install ${id}@${target} --scope ${scope}`),
  };
}

export function buildScript(catalog: Catalog, selected: string[], scope: Scope, channel: Channel): string {
  const { add, installs } = buildCommands(catalog, selected, scope, channel);
  const { ordered, requiredBy } = resolveSelection(selected, catalog.plugins);
  const deps = installs.filter((_, i) => requiredBy.has(ordered[i]));
  const chosen = installs.filter((_, i) => !requiredBy.has(ordered[i]));
  const lines = ['# 1 marketplace', add];
  if (deps.length) lines.push('# 2 dependencies first', ...deps);
  lines.push(`# ${deps.length ? 3 : 2} selected`, ...chosen);
  return lines.join('\n');
}
