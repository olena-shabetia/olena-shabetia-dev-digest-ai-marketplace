import type { Catalog } from './types';

const counts = { skill: 0, agent: 0, command: 0, hook: 0 };

/** A small catalog shaped like index.json, shared by the unit tests. */
export const catalog: Catalog = {
  generatedAt: '2026-10-21T00:00:00Z',
  marketplace: { name: 'mp', repo: 'me/mp', stable: { name: 'mp-stable', ref: 'me/mp#stable' } },
  plugins: [
    { id: 'base', version: '1.0.0', description: 'Shared engineering skills', dependencies: [], dependents: ['sdd'], minClaudeCodeVersion: null, counts: { ...counts, skill: 2 }, readme: '# base', changelog: [], path: 'plugins/base' },
    { id: 'extra', version: '1.0.0', description: 'Extra tools', dependencies: [{ name: 'base', range: '^1.0.0' }], dependents: ['sdd'], minClaudeCodeVersion: null, counts, readme: '', changelog: [], path: 'plugins/extra' },
    { id: 'sdd', version: '1.0.0', description: 'Spec-driven development workflow', dependencies: [{ name: 'base', range: '^1.0.0' }, { name: 'extra', range: '^1.0.0' }], dependents: [], minClaudeCodeVersion: '2.1.110', counts: { ...counts, skill: 1, agent: 1 }, readme: 'Runs plans with reviewer agents', changelog: [], path: 'plugins/sdd' },
  ],
  artifacts: [
    { id: 'base/skill/architecture-review', type: 'skill', name: 'architecture-review', plugin: 'base', description: 'Review a proposed architecture against constraints.', tools: ['Read', 'Grep'], body: 'Steps for the review', bodyTruncated: false, path: 'plugins/base/skills/architecture-review/SKILL.md' },
    { id: 'base/skill/write-spec', type: 'skill', name: 'write-spec', plugin: 'base', description: 'Interview the user and produce a spec.', tools: [], body: 'Ask about goals. Afterwards the architecture is documented in an ADR.', bodyTruncated: false, path: 'plugins/base/skills/write-spec/SKILL.md' },
    { id: 'sdd/agent/reviewer', type: 'agent', name: 'reviewer', plugin: 'sdd', description: 'Reviews change sets and returns comments.', tools: ['Read'], body: '', bodyTruncated: false, path: 'plugins/sdd/agents/reviewer.md' },
  ],
  docs: [{ id: 'docs/RELEASES.md', title: 'Releases', body: 'How to cut a release' }],
  releases: [],
};
