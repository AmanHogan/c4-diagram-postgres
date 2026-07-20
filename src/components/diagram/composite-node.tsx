"use client";

import { memo } from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight, Maximize2 } from "lucide-react";
import {
  NODE_COLORS,
  NODE_KIND_LABELS,
  type LineStyle,
  type NodeKind,
  type NodeShape,
} from "@/lib/diagram-types";

export interface CompositeNodeData extends Record<string, unknown> {
  label: string;
  kind: NodeKind;
  description?: string;
  shape: NodeShape;
  fillColor: string;
  borderStyle: LineStyle;
  hasChildren: boolean;
  expanded: boolean;
  readOnly?: boolean;
  onToggleExpand: (id: string) => void;
  onDrillIn: (id: string) => void;
}

const HANDLE_POSITIONS = [Position.Top, Position.Right, Position.Bottom, Position.Left];

const BORDER_STYLE_CSS: Record<LineStyle, string> = {
  solid: "solid",
  dashed: "dashed",
  dotted: "dotted",
};

const SHAPE_STYLE: Record<NodeShape, React.CSSProperties> = {
  rectangle: { borderRadius: "0.25rem" },
  rounded: { borderRadius: "1rem" },
  diamond: { borderRadius: 0, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" },
  ellipse: { borderRadius: "50%" },
};

const CENTERED_SHAPES: NodeShape[] = ["diamond", "ellipse"];

const FILL_BASE: [number, number, number] = [30, 32, 32];

/**
 * Blend a hex accent color into the dark base so each box reads as a deep,
 * desaturated tint of its category color rather than a flat grey.
 */
function tintFill(hex: string, ratio: number): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return `rgb(${FILL_BASE.join(",")})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number, base: number): number => Math.round(c * ratio + base * (1 - ratio));
  return `rgb(${mix(r, FILL_BASE[0])}, ${mix(g, FILL_BASE[1])}, ${mix(b, FILL_BASE[2])})`;
}

function CompositeNodeImpl({ id, data, selected }: NodeProps): React.JSX.Element {
  const {
    label,
    kind,
    description,
    shape,
    fillColor,
    borderStyle,
    hasChildren,
    expanded,
    readOnly,
    onToggleExpand,
    onDrillIn,
  } = data as CompositeNodeData;
  const color = fillColor || NODE_COLORS[kind];
  const centered = CENTERED_SHAPES.includes(shape);

  return (
    <div
      className="group relative h-full w-full"
      onDoubleClick={(event) => {
        event.stopPropagation();
        onDrillIn(id);
      }}
    >
      <NodeResizer
        isVisible={selected && !readOnly}
        minWidth={180}
        minHeight={64}
        color={color}
        handleStyle={{ width: 8, height: 8 }}
      />

      <div
        className="h-full w-full cursor-pointer shadow-md transition-shadow hover:shadow-lg"
        style={{
          ...SHAPE_STYLE[shape],
          backgroundColor: tintFill(color, 0.18),
          borderWidth: 2,
          borderStyle: BORDER_STYLE_CSS[borderStyle],
          borderColor: color,
          boxShadow: selected ? `0 0 0 3px ${color}66` : undefined,
        }}
      >
        <div
          className={
            centered
              ? "flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden p-6 text-center"
              : "flex h-full w-full flex-col gap-1 overflow-hidden p-3"
          }
        >
          <div className={centered ? "flex items-center gap-2" : "flex items-center justify-between gap-2"}>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
              style={{ backgroundColor: `${color}26`, color }}
            >
              {NODE_KIND_LABELS[kind]}
            </span>
            <div className="flex items-center gap-0.5">
              {hasChildren && !centered ? (
                <>
                  <button
                    type="button"
                    title={expanded ? "Collapse" : "Expand children inline"}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-muted"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleExpand(id);
                    }}
                  >
                    {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    title="Drill into this node"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-muted"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDrillIn(id);
                    }}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
          <span className="line-clamp-2 break-words text-sm font-semibold leading-tight" title={label}>
            {label}
          </span>
          {!expanded && description ? (
            <p className="line-clamp-2 break-words text-xs text-muted-foreground" title={description}>
              {description}
            </p>
          ) : null}
          {hasChildren && centered ? (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                title={expanded ? "Collapse" : "Expand children inline"}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-muted"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleExpand(id);
                }}
              >
                {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                title="Drill into this node"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-muted"
                onClick={(event) => {
                  event.stopPropagation();
                  onDrillIn(id);
                }}
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {HANDLE_POSITIONS.map((position) => (
        <Handle
          key={`src-${position}`}
          type="source"
          position={position}
          id={position}
          className="!h-3 !w-3 !border-2 !border-current opacity-0 transition-opacity group-hover:opacity-100"
          style={{ backgroundColor: color, color: tintFill(color, 0.4) }}
        />
      ))}
      {HANDLE_POSITIONS.map((position) => (
        <Handle
          key={`tgt-${position}`}
          type="target"
          position={position}
          id={`${position}-target`}
          className="!h-3 !w-3 !border-2 !border-current opacity-0 transition-opacity group-hover:opacity-100"
          style={{ backgroundColor: color, color: tintFill(color, 0.4) }}
        />
      ))}
    </div>
  );
}

export const CompositeNode = memo(CompositeNodeImpl);
