export type ArtifactType = 'skill' | 'agent' | 'command' | 'hook';
export type ItemType = 'plugin' | ArtifactType;

export const ITEM_TYPES: ItemType[] = ['plugin', 'skill', 'agent', 'command', 'hook'];
export const ARTIFACT_TYPES: ArtifactType[] = ['skill', 'agent', 'command', 'hook'];

export interface Dependency {
  name: string;
  range: string;
}

export interface ChangelogEntry {
  version: string;
  date: string | null;
  markdown: string;
}

export interface Plugin {
  id: string;
  version: string;
  description: string;
  dependencies: Dependency[];
  dependents: string[];
  minClaudeCodeVersion: string | null;
  counts: Record<ArtifactType, number>;
  readme: string;
  changelog: ChangelogEntry[];
  path: string;
}

export interface Artifact {
  id: string;
  type: ArtifactType;
  name: string;
  plugin: string;
  description: string;
  tools: string[];
  body: string;
  bodyTruncated: boolean;
  path: string;
}

export interface Doc {
  id: string;
  title: string;
  body: string;
}

export interface Release {
  plugin: string;
  version: string;
  date: string | null;
  tag: string;
  tagged: boolean;
  note: string;
}

export interface Catalog {
  generatedAt: string;
  marketplace: { name: string; repo: string; stable: { name: string; ref: string } };
  plugins: Plugin[];
  artifacts: Artifact[];
  docs: Doc[];
  releases: Release[];
}

export type Scope = 'project' | 'user';
export type Channel = 'latest' | 'stable';
