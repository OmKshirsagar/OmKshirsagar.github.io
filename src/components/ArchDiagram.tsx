import { type ReactElement } from 'react';
import type { ArchEdge, ArchLayer, ArchNode } from '@/data/select';

interface Props {
  nodes: ArchNode[];
  edges: ArchEdge[];
}

// Column order, left → right. UI is placed AT THE END (after storage) so the
// natural flow edge → orchestrator → ai → storage → ui matches data flow in
// most case studies and reduces the number of cross-column jumps.
const LAYER_ORDER: ArchLayer[] = ['edge', 'orchestrator', 'ai', 'storage', 'ui'];
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
// Vertical padding reserved above + below the row grid so non-adjacent edges
// can route through a "highway" without crashing into row content.
const HIGHWAY_PAD = 22;

interface EdgeRoute {
  d: string;
  labelX: number;
  labelY: number;
  /** SVG transform rotation for the label, in degrees. Empty string for none. */
  labelTransform: string;
}

/**
 * Build an orthogonal (right-angle) path for one edge.
 *
 *  - Same column (vertical sibling): a smooth C-curve that arcs out to the
 *    right of the column, like the previous version.
 *  - Adjacent columns: 3-segment step — exit horizontally → traverse vertically
 *    in the inter-column lane → enter horizontally.
 *  - Non-adjacent columns (jumping over intermediate columns): 5-segment
 *    route via a "highway" above (or below) the row grid, so the line never
 *    passes through a box that sits between source and target. Highway side
 *    is chosen by whichever endpoint is closer to the top/bottom edge.
 */
function buildEdge(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fromCol: number,
  toCol: number,
  gridTop: number,
  gridBottom: number,
): EdgeRoute {
  const sameCol = fromCol === toCol;
  const fromYMid = from.y + BOX_H / 2;
  const toYMid = to.y + BOX_H / 2;

  if (sameCol) {
    const x1 = from.x + BOX_W;
    const arcOut = 50;
    return {
      d: `M ${x1} ${fromYMid} C ${x1 + arcOut} ${fromYMid}, ${x1 + arcOut} ${toYMid}, ${x1} ${toYMid}`,
      labelX: x1 + arcOut + 4,
      labelY: (fromYMid + toYMid) / 2,
      labelTransform: '',
    };
  }

  const goingRight = toCol > fromCol;
  const colDiff = Math.abs(toCol - fromCol);
  const exitX = goingRight ? from.x + BOX_W : from.x;
  const entryX = goingRight ? to.x : to.x + BOX_W;

  if (colDiff === 1) {
    // Adjacent columns: simple step through the inter-column lane.
    const midX = (exitX + entryX) / 2;
    return {
      d: `M ${exitX} ${fromYMid} L ${midX} ${fromYMid} L ${midX} ${toYMid} L ${entryX} ${toYMid}`,
      labelX: midX,
      labelY: Math.min(fromYMid, toYMid) - 6,
      labelTransform: '',
    };
  }

  // Non-adjacent: route via a highway above or below the row grid so we
  // never cross an intermediate box.
  const goesAbove = (fromYMid + toYMid) / 2 < (gridTop + gridBottom) / 2;
  const highwayY = goesAbove ? gridTop - HIGHWAY_PAD : gridBottom + HIGHWAY_PAD;
  // Vertical-traversal lanes sit just outside source / target columns.
  const laneOut = goingRight ? exitX + COL_GAP / 2 : exitX - COL_GAP / 2;
  const laneIn = goingRight ? entryX - COL_GAP / 2 : entryX + COL_GAP / 2;

  return {
    d:
      `M ${exitX} ${fromYMid} ` +
      `L ${laneOut} ${fromYMid} ` +
      `L ${laneOut} ${highwayY} ` +
      `L ${laneIn} ${highwayY} ` +
      `L ${laneIn} ${toYMid} ` +
      `L ${entryX} ${toYMid}`,
    labelX: (laneOut + laneIn) / 2,
    labelY: highwayY + (goesAbove ? -6 : 14),
    labelTransform: '',
  };
}

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
  const colIndex = new Map<ArchLayer, number>();
  cols.forEach((c, i) => colIndex.set(c, i));

  // Coordinates per node (top-left corner of its box)
  const coords = new Map<string, { x: number; y: number; col: number }>();
  cols.forEach((layer, colIdx) => {
    const ns = byLayer.get(layer)!;
    ns.forEach((node, rowIdx) => {
      coords.set(node.id, {
        x: SIDE_PAD + colIdx * (BOX_W + COL_GAP),
        y: TOP_PAD + HIGHWAY_PAD + rowIdx * (BOX_H + ROW_GAP),
        col: colIdx,
      });
    });
  });

  const maxRows = Math.max(...cols.map((l) => byLayer.get(l)!.length));
  const gridTop = TOP_PAD + HIGHWAY_PAD;
  const gridBottom = gridTop + maxRows * BOX_H + (maxRows - 1) * ROW_GAP;
  const width = SIDE_PAD * 2 + cols.length * BOX_W + (cols.length - 1) * COL_GAP;
  const height = gridBottom + HIGHWAY_PAD + 16;

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
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,210,154,0.75)" />
          </marker>
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

        {/* Edges (drawn before nodes so boxes paint over any tiny stroke overshoot) */}
        {edges.map((e, i) => {
          const from = coords.get(e.from);
          const to = coords.get(e.to);
          if (!from || !to) return null;

          const route = buildEdge(from, to, from.col, to.col, gridTop, gridBottom);

          return (
            <g key={`edge-${i}`}>
              <path
                d={route.d}
                stroke="rgba(255,210,154,0.45)"
                strokeWidth="1.3"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
                markerEnd="url(#arch-arrow)"
              />
              {e.label && (
                <text
                  x={route.labelX}
                  y={route.labelY}
                  fill="#a09387"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="500"
                  textAnchor="middle"
                  // Small black halo so labels stay readable when they sit
                  // near another edge segment
                  paintOrder="stroke"
                  stroke="#0d0d14"
                  strokeWidth="2.5"
                >
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes (drawn last, on top of all edge paths) */}
        {nodes.map((n) => {
          const c = coords.get(n.id);
          if (!c) return null;
          return (
            <g key={n.id} transform={`translate(${c.x},${c.y})`}>
              <rect
                width={BOX_W}
                height={BOX_H}
                rx={4}
                fill="rgba(20,20,28,0.96)"
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
