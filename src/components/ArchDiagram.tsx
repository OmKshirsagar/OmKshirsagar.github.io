import { type ReactElement } from 'react';
import type { ArchEdge, ArchLayer, ArchNode } from '@/data/select';

interface Props {
  nodes: ArchNode[];
  edges: ArchEdge[];
}

const LAYER_ORDER: ArchLayer[] = ['edge', 'ui', 'orchestrator', 'ai', 'storage'];
const LAYER_LABEL: Record<ArchLayer, string> = {
  edge: 'EDGE',
  ui: 'UI',
  orchestrator: 'ORCHESTRATOR',
  ai: 'AI',
  storage: 'STORAGE',
};

const BOX_W = 188;
const BOX_H = 60;
const COL_GAP = 64;
const ROW_GAP = 22;
const TOP_PAD = 32;
const SIDE_PAD = 14;

export default function ArchDiagram({ nodes, edges }: Props): ReactElement | null {
  if (nodes.length === 0) return null;

  // Group nodes by layer, preserve insertion order within layer
  const byLayer = new Map<ArchLayer, ArchNode[]>();
  for (const n of nodes) {
    if (!byLayer.has(n.layer)) byLayer.set(n.layer, []);
    byLayer.get(n.layer)!.push(n);
  }

  // Column order: only layers that are populated
  const cols = LAYER_ORDER.filter((l) => byLayer.has(l));

  // Compute coordinates per node
  const coords = new Map<string, { x: number; y: number }>();
  cols.forEach((layer, colIdx) => {
    const ns = byLayer.get(layer)!;
    ns.forEach((node, rowIdx) => {
      coords.set(node.id, {
        x: SIDE_PAD + colIdx * (BOX_W + COL_GAP),
        y: TOP_PAD + rowIdx * (BOX_H + ROW_GAP),
      });
    });
  });

  const maxRows = Math.max(...cols.map((l) => byLayer.get(l)!.length));
  const width = SIDE_PAD * 2 + cols.length * BOX_W + (cols.length - 1) * COL_GAP;
  const height = TOP_PAD + maxRows * BOX_H + (maxRows - 1) * ROW_GAP + 16;

  return (
    <div className="arch-wrap">
      <svg
        className="arch-svg"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label="System architecture diagram"
      >
        <defs>
          <marker
            id="arch-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerUnits="userSpaceOnUse"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,210,154,0.7)" />
          </marker>
          <filter id="arch-glow">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Layer headings */}
        {cols.map((layer, i) => (
          <text
            key={layer}
            x={SIDE_PAD + i * (BOX_W + COL_GAP) + BOX_W / 2}
            y={16}
            fill="#ff9460"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="700"
            textAnchor="middle"
            letterSpacing="0.22em"
          >
            {LAYER_LABEL[layer]}
          </text>
        ))}

        {/* Edges (drawn first, below boxes) */}
        {edges.map((e, i) => {
          const from = coords.get(e.from);
          const to = coords.get(e.to);
          if (!from || !to) return null;

          const sameCol = Math.abs(from.x - to.x) < 1;
          const x1 = sameCol ? from.x + BOX_W : from.x + BOX_W;
          const y1 = from.y + BOX_H / 2;
          const x2 = to.x;
          const y2 = to.y + BOX_H / 2;

          // Bezier control points: bow outward by 40% of horizontal distance
          const dx = Math.max(20, (x2 - x1) * 0.5);
          const cp1x = x1 + dx;
          const cp1y = y1;
          const cp2x = x2 - dx;
          const cp2y = y2;

          const d = sameCol
            ? // Same column: arc outward to the right then back
              `M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x1 + 60} ${y2}, ${x1} ${y2}`
            : `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

          return (
            <g key={`edge-${i}`}>
              <path
                d={d}
                stroke="rgba(255,210,154,0.4)"
                strokeWidth="1.2"
                fill="none"
                markerEnd="url(#arch-arrow)"
              />
              {e.label && !sameCol && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 6}
                  fill="#a09387"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes (drawn last, on top) */}
        {nodes.map((n) => {
          const c = coords.get(n.id);
          if (!c) return null;
          return (
            <g key={n.id} transform={`translate(${c.x},${c.y})`}>
              <rect
                width={BOX_W}
                height={BOX_H}
                rx={4}
                fill="rgba(20,20,28,0.92)"
                stroke="rgba(255,210,154,0.32)"
                strokeWidth="1"
              />
              <foreignObject x={6} y={4} width={BOX_W - 12} height={BOX_H - 8}>
                <div
                  // @ts-expect-error xmlns is valid on inline foreignObject content but not in React types
                  xmlns="http://www.w3.org/1999/xhtml"
                  className="arch-node-text"
                >
                  {n.label}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>

      <style>{`
        .arch-wrap {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0 0 6px;
          background:
            radial-gradient(circle at 50% 40%, rgba(255,210,154,0.04), transparent 70%),
            #0d0d14;
          border: 1px solid rgba(255, 210, 154, 0.12);
          border-radius: 6px;
        }
        .arch-svg {
          display: block;
          margin: 0 auto;
        }
        .arch-node-text {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font: 500 11px/1.25 'Inter', system-ui, sans-serif;
          color: #ffd29a;
          padding: 0 4px;
          box-sizing: border-box;
          letter-spacing: 0;
        }
      `}</style>
    </div>
  );
}
