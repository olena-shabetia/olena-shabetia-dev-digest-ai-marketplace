import { t } from '../messages';
import type { ItemType } from '../types';

const ICONS: Record<ItemType, JSX.Element> = {
  plugin: (
    <>
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
      <path d="m3 8 9 5 9-5M12 13v8" />
    </>
  ),
  skill: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  agent: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 8V4M9 13v2M15 13v2" />
    </>
  ),
  command: <path d="m5 7 5 5-5 5M12 18h7" />,
  hook: (
    <>
      <path d="M12 3v8a4 4 0 1 0 4 4" />
      <circle cx="12" cy="3.5" r="1" />
    </>
  ),
};

export function TypeBadge({ type }: { type: ItemType }) {
  return (
    <span className={`badge t-${type}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ICONS[type]}
      </svg>
      {t(`types.singular.${type}`)}
    </span>
  );
}

export const displayName = (type: ItemType, name: string) => (type === 'command' ? `/${name}` : name);
