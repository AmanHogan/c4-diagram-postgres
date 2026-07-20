import type { DiagramDocument, DiagramEdgeData, DiagramNodeData, NodeShape } from "./diagram-types";

const SHAPE_SYNTAX: Record<NodeShape, [string, string]> = {
  rectangle: ["[", "]"],
  rounded: ["(", ")"],
  diamond: ["{", "}"],
  ellipse: ["([", "])"],
};

function escapeLabel(text: string): string {
  return text.replace(/"/g, "#quot;");
}

function nodeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function renderNode(node: DiagramNodeData): string {
  const [open, close] = SHAPE_SYNTAX[node.shape ?? "rounded"];
  const label = escapeLabel(node.label);
  return `${nodeId(node.id)}${open}"${label}"${close}`;
}

function renderEdge(edge: DiagramEdgeData): string {
  const src = nodeId(edge.source);
  const tgt = nodeId(edge.target);
  const label = edge.label ? `|"${escapeLabel(edge.label)}"|` : "";

  const dashed = edge.lineStyle === "dashed" || edge.lineStyle === "dotted";
  const arrow = edge.arrowStyle ?? "forward";

  if (arrow === "none") {
    return dashed ? `${src} -.-${label} ${tgt}` : `${src} ---${label} ${tgt}`;
  }
  if (arrow === "both") {
    return dashed ? `${src} <-.->${label} ${tgt}` : `${src} <-->${label} ${tgt}`;
  }
  return dashed ? `${src} -.->${label} ${tgt}` : `${src} -->${label} ${tgt}`;
}

function renderNodesRecursive(
  parentId: string | null,
  nodes: DiagramNodeData[],
  indent: string,
): string[] {
  const children = nodes.filter((n) => n.parentId === parentId);
  const lines: string[] = [];

  for (const child of children) {
    const grandchildren = nodes.filter((n) => n.parentId === child.id);
    if (grandchildren.length > 0) {
      lines.push(`${indent}subgraph ${nodeId(child.id)}["${escapeLabel(child.label)}"]`);
      lines.push(...renderNodesRecursive(child.id, nodes, indent + "  "));
      lines.push(`${indent}end`);
    } else {
      lines.push(`${indent}${renderNode(child)}`);
    }
  }

  return lines;
}

export function diagramToMermaid(doc: DiagramDocument): string {
  const lines: string[] = ["flowchart TD"];

  lines.push(...renderNodesRecursive(null, doc.nodes, "  "));

  for (const edge of doc.edges) {
    const srcNode = doc.nodes.find((n) => n.id === edge.source);
    const tgtNode = doc.nodes.find((n) => n.id === edge.target);
    if (!srcNode || !tgtNode) continue;
    lines.push(`  ${renderEdge(edge)}`);
  }

  return lines.join("\n");
}
