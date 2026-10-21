import { describe, expect, it } from 'vitest';
import { buildCommands, buildScript, resolveSelection } from './install';
import { catalog } from './fixtures';

describe('resolveSelection', () => {
  it('puts dependencies before the plugin that needs them', () => {
    const { ordered, requiredBy } = resolveSelection(['sdd'], catalog.plugins);
    expect(ordered).toEqual(['base', 'extra', 'sdd']);
    expect(requiredBy.get('base')).toEqual(['sdd']);
    expect(requiredBy.has('sdd')).toBe(false);
  });

  it('does not duplicate plugins selected together with their dependencies', () => {
    const { ordered, requiredBy } = resolveSelection(['base', 'sdd'], catalog.plugins);
    expect(ordered.filter((p) => p === 'base')).toHaveLength(1);
    expect(requiredBy.has('base')).toBe(false);
  });

  it('survives dependency cycles', () => {
    const cyc = catalog.plugins.map((p) => (p.id === 'base' ? { ...p, dependencies: [{ name: 'sdd', range: '*' }] } : p));
    expect(() => resolveSelection(['sdd'], cyc)).not.toThrow();
  });
});

describe('buildCommands', () => {
  it('uses the latest marketplace by default', () => {
    const c = buildCommands(catalog, ['sdd'], 'project', 'latest');
    expect(c.add).toBe('claude plugin marketplace add me/mp --scope project');
    expect(c.installs).toEqual([
      'claude plugin install base@mp --scope project',
      'claude plugin install extra@mp --scope project',
      'claude plugin install sdd@mp --scope project',
    ]);
  });

  it('points at the pinned stable marketplace for the stable channel', () => {
    const c = buildCommands(catalog, ['base'], 'user', 'stable');
    expect(c.add).toBe('claude plugin marketplace add me/mp#stable --scope user');
    expect(c.installs).toEqual(['claude plugin install base@mp-stable --scope user']);
  });
});

describe('buildScript', () => {
  it('lists dependencies before the selected plugin', () => {
    const lines = buildScript(catalog, ['sdd'], 'project', 'latest').split('\n');
    const at = (s: string) => lines.findIndex((l) => l.includes(s));
    expect(at('install base@')).toBeLessThan(at('install sdd@'));
    expect(lines).toContain('# 2 dependencies first');
    expect(lines).toContain('# 3 selected');
  });

  it('omits the dependency section when there are none', () => {
    expect(buildScript(catalog, ['base'], 'project', 'latest')).not.toContain('dependencies first');
  });
});
