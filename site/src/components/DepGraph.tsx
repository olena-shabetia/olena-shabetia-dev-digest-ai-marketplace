import { t } from '../messages';
import { pluginHref } from '../router';

const NODE_W = 210;
const NODE_H = 40;
const PITCH = 56;
const COL = { left: 10, mid: 245, right: 480 };
const WIDTH = 700;

const clip = (s: string) => (s.length > 24 ? `${s.slice(0, 23)}…` : s);

/** Plugins this one requires (left), the plugin itself, and plugins that require it (right). */
export function DepGraph({ id, requires, requiredBy }: { id: string; requires: string[]; requiredBy: string[] }) {
  const rows = Math.max(requires.length, requiredBy.length, 1);
  const height = rows * PITCH - (PITCH - NODE_H) + 20;
  const y = (i: number, count: number) => (height - (count * PITCH - (PITCH - NODE_H))) / 2 + i * PITCH;
  const selfY = y(0, 1);
  const selfMid = selfY + NODE_H / 2;

  const node = (name: string, x: number, top: number, self = false) => {
    const rect = <rect x={x} y={top} width={NODE_W} height={NODE_H} rx={20} strokeWidth={self ? 0 : 1.5} />;
    const text = (
      <text x={x + NODE_W / 2} y={top + NODE_H / 2 + 4.5} textAnchor="middle">
        {clip(name)}
      </text>
    );
    return self ? (
      <g key={name} className="node-self">
        {rect}
        {text}
      </g>
    ) : (
      <a key={name} className="node-link" href={pluginHref(name)}>
        <title>{name}</title>
        {rect}
        {text}
      </a>
    );
  };

  const summary = t('depGraph.summary', {
    id,
    requires: requires.length ? requires.join(', ') : t('depGraph.nothing'),
    requiredBy: requiredBy.length ? requiredBy.join(', ') : t('depGraph.noPlugin'),
  });

  return (
    <figure className="graph">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label={summary}>
        {requires.map((name, i) => {
          const top = y(i, requires.length);
          const mid = top + NODE_H / 2;
          const x1 = COL.mid;
          const x2 = COL.left + NODE_W + 9;
          return (
            <g key={`r-${name}`}>
              <path className="edge" d={`M${x1} ${selfMid}C${x1 - 30} ${selfMid} ${x2 + 30} ${mid} ${x2} ${mid}`} />
              <path className="arrow" d={`M${x2 - 9} ${mid}l9-5v10z`} />
            </g>
          );
        })}
        {requiredBy.map((name, i) => {
          const top = y(i, requiredBy.length);
          const mid = top + NODE_H / 2;
          const x1 = COL.right;
          const x2 = COL.mid + NODE_W + 9;
          return (
            <g key={`d-${name}`}>
              <path className="edge" d={`M${x1} ${mid}C${x1 - 30} ${mid} ${x2 + 30} ${selfMid} ${x2} ${selfMid}`} />
              <path className="arrow" d={`M${x2 - 9} ${selfMid}l9-5v10z`} />
            </g>
          );
        })}
        {requires.map((name, i) => node(name, COL.left, y(i, requires.length)))}
        {requiredBy.map((name, i) => node(name, COL.right, y(i, requiredBy.length)))}
        {node(id, COL.mid, selfY, true)}
      </svg>
    </figure>
  );
}
