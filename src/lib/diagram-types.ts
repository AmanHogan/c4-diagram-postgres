export type NodeKind =
  // Infrastructure
  | "physical"
  | "vm"
  | "container"
  | "pod"
  | "serverless"
  // Networking
  | "network"
  | "load-balancer"
  | "api-gateway"
  | "cdn"
  | "dns"
  | "firewall"
  | "proxy"
  // Compute & Services
  | "service"
  | "microservice"
  | "web-server"
  | "worker"
  | "cron-job"
  // Data
  | "database"
  | "cache"
  | "message-queue"
  | "event-bus"
  | "data-lake"
  | "object-storage"
  // Kubernetes / Orchestration
  | "cluster-component"
  | "namespace"
  | "workload"
  // Access & Auth
  | "external-access"
  | "user"
  | "client"
  | "auth-provider"
  // Monitoring & Ops
  | "monitoring"
  | "logging"
  | "ci-cd"
  // Organization
  | "group"
  | "region"
  | "availability-zone"
  // Flowchart
  | "start"
  | "end"
  | "process"
  | "decision"
  | "io"
  | "subprocess"
  // Generic
  | "custom";

export type EdgeKind =
  | "lan"
  | "wan"
  | "tailscale"
  | "overlay"
  | "https"
  | "grpc"
  | "websocket"
  | "tcp"
  | "udp"
  | "routes-to"
  | "provisions"
  | "stores-in"
  | "publishes"
  | "subscribes"
  | "reads-from"
  | "writes-to"
  | "authenticates"
  | "depends-on";

export type NodeShape = "rectangle" | "rounded" | "diamond" | "ellipse";
export type LineStyle = "solid" | "dashed" | "dotted";
export type ArrowStyle = "forward" | "both" | "none";

export interface DiagramNodeData {
  id: string;
  kind: NodeKind;
  label: string;
  parentId: string | null;
  expanded: boolean;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  collapsedSize?: { width: number; height: number };
  description?: string;
  shape?: NodeShape;
  fillColor?: string;
  borderStyle?: LineStyle;
}

export interface DiagramEdgeData {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  label?: string;
  lineStyle?: LineStyle;
  arrowStyle?: ArrowStyle;
}

export interface DiagramDocument {
  nodes: DiagramNodeData[];
  edges: DiagramEdgeData[];
}

export const EDGE_STYLES: Record<EdgeKind, { stroke: string; lineStyle: LineStyle }> = {
  lan: { stroke: "#60a5fa", lineStyle: "solid" },
  wan: { stroke: "#818cf8", lineStyle: "solid" },
  tailscale: { stroke: "#a78bfa", lineStyle: "dashed" },
  overlay: { stroke: "#fbbf24", lineStyle: "dashed" },
  https: { stroke: "#34d399", lineStyle: "solid" },
  grpc: { stroke: "#2dd4bf", lineStyle: "solid" },
  websocket: { stroke: "#22d3ee", lineStyle: "dashed" },
  tcp: { stroke: "#60a5fa", lineStyle: "solid" },
  udp: { stroke: "#60a5fa", lineStyle: "dotted" },
  "routes-to": { stroke: "#34d399", lineStyle: "solid" },
  provisions: { stroke: "#f472b6", lineStyle: "solid" },
  "stores-in": { stroke: "#94a3b8", lineStyle: "dotted" },
  publishes: { stroke: "#fb923c", lineStyle: "solid" },
  subscribes: { stroke: "#a78bfa", lineStyle: "solid" },
  "reads-from": { stroke: "#67e8f9", lineStyle: "dashed" },
  "writes-to": { stroke: "#f87171", lineStyle: "solid" },
  authenticates: { stroke: "#fbbf24", lineStyle: "solid" },
  "depends-on": { stroke: "#94a3b8", lineStyle: "dashed" },
};

export const NODE_COLORS: Record<NodeKind, string> = {
  // Infrastructure
  physical: "#64748b",
  vm: "#3b82f6",
  container: "#0ea5e9",
  pod: "#06b6d4",
  serverless: "#a855f7",
  // Networking
  network: "#06b6d4",
  "load-balancer": "#f59e0b",
  "api-gateway": "#eab308",
  cdn: "#84cc16",
  dns: "#22c55e",
  firewall: "#ef4444",
  proxy: "#f97316",
  // Compute & Services
  service: "#3b82f6",
  microservice: "#6366f1",
  "web-server": "#8b5cf6",
  worker: "#a78bfa",
  "cron-job": "#c084fc",
  // Data
  database: "#10b981",
  cache: "#14b8a6",
  "message-queue": "#f97316",
  "event-bus": "#fb923c",
  "data-lake": "#0d9488",
  "object-storage": "#059669",
  // Kubernetes
  "cluster-component": "#8b5cf6",
  namespace: "#f59e0b",
  workload: "#10b981",
  // Access & Auth
  "external-access": "#f43f5e",
  user: "#ec4899",
  client: "#f472b6",
  "auth-provider": "#e11d48",
  // Monitoring & Ops
  monitoring: "#22d3ee",
  logging: "#67e8f9",
  "ci-cd": "#a3e635",
  // Organization
  group: "#94a3b8",
  region: "#78716c",
  "availability-zone": "#a8a29e",
  // Flowchart
  start: "#22c55e",
  end: "#ef4444",
  process: "#3b82f6",
  decision: "#f59e0b",
  io: "#8b5cf6",
  subprocess: "#6366f1",
  // Generic
  custom: "#6b7280",
};

export const NODE_KIND_LABELS: Record<NodeKind, string> = {
  // Infrastructure
  physical: "Physical Server",
  vm: "Virtual Machine",
  container: "Container",
  pod: "Pod",
  serverless: "Serverless Function",
  // Networking
  network: "Network",
  "load-balancer": "Load Balancer",
  "api-gateway": "API Gateway",
  cdn: "CDN",
  dns: "DNS",
  firewall: "Firewall",
  proxy: "Proxy",
  // Compute & Services
  service: "Service",
  microservice: "Microservice",
  "web-server": "Web Server",
  worker: "Worker",
  "cron-job": "Cron Job",
  // Data
  database: "Database",
  cache: "Cache",
  "message-queue": "Message Queue",
  "event-bus": "Event Bus",
  "data-lake": "Data Lake",
  "object-storage": "Object Storage",
  // Kubernetes
  "cluster-component": "Cluster Component",
  namespace: "Namespace",
  workload: "Workload",
  // Access & Auth
  "external-access": "External Access",
  user: "User",
  client: "Client App",
  "auth-provider": "Auth Provider",
  // Monitoring & Ops
  monitoring: "Monitoring",
  logging: "Logging",
  "ci-cd": "CI/CD Pipeline",
  // Organization
  group: "Group",
  region: "Region",
  "availability-zone": "Availability Zone",
  // Flowchart
  start: "Start",
  end: "End",
  process: "Process",
  decision: "Decision",
  io: "Input/Output",
  subprocess: "Subprocess",
  // Generic
  custom: "Custom",
};

export const NODE_KIND_CATEGORIES: Record<string, NodeKind[]> = {
  Infrastructure: ["physical", "vm", "container", "pod", "serverless"],
  Networking: ["network", "load-balancer", "api-gateway", "cdn", "dns", "firewall", "proxy"],
  "Compute & Services": ["service", "microservice", "web-server", "worker", "cron-job"],
  Data: ["database", "cache", "message-queue", "event-bus", "data-lake", "object-storage"],
  Kubernetes: ["cluster-component", "namespace", "workload"],
  "Access & Auth": ["external-access", "user", "client", "auth-provider"],
  "Monitoring & Ops": ["monitoring", "logging", "ci-cd"],
  Organization: ["group", "region", "availability-zone"],
  Flowchart: ["start", "end", "process", "decision", "io", "subprocess"],
  Generic: ["custom"],
};

export const EDGE_KIND_LABELS: Record<EdgeKind, string> = {
  lan: "LAN",
  wan: "WAN",
  tailscale: "Tailscale",
  overlay: "Overlay",
  https: "HTTPS",
  grpc: "gRPC",
  websocket: "WebSocket",
  tcp: "TCP",
  udp: "UDP",
  "routes-to": "Routes to",
  provisions: "Provisions",
  "stores-in": "Stores in",
  publishes: "Publishes",
  subscribes: "Subscribes",
  "reads-from": "Reads from",
  "writes-to": "Writes to",
  authenticates: "Authenticates",
  "depends-on": "Depends on",
};

export const DEFAULT_NODE_SHAPE: Partial<Record<NodeKind, NodeShape>> = {
  start: "ellipse",
  end: "ellipse",
  process: "rectangle",
  decision: "diamond",
  io: "rectangle",
  subprocess: "rounded",
};

export function flowchartTemplate(): DiagramDocument {
  return {
    nodes: [
      {
        id: "fc-start",
        kind: "start",
        label: "Start",
        parentId: null,
        expanded: false,
        position: { x: 250, y: 0 },
        shape: "ellipse",
      },
      {
        id: "fc-process-1",
        kind: "process",
        label: "Step 1",
        parentId: null,
        expanded: false,
        position: { x: 225, y: 120 },
        shape: "rectangle",
      },
      {
        id: "fc-decision-1",
        kind: "decision",
        label: "Condition?",
        parentId: null,
        expanded: false,
        position: { x: 225, y: 260 },
        shape: "diamond",
        size: { width: 160, height: 100 },
      },
      {
        id: "fc-process-2",
        kind: "process",
        label: "Step 2",
        parentId: null,
        expanded: false,
        position: { x: 100, y: 420 },
        shape: "rectangle",
      },
      {
        id: "fc-process-3",
        kind: "process",
        label: "Step 3",
        parentId: null,
        expanded: false,
        position: { x: 350, y: 420 },
        shape: "rectangle",
      },
      {
        id: "fc-end",
        kind: "end",
        label: "End",
        parentId: null,
        expanded: false,
        position: { x: 250, y: 560 },
        shape: "ellipse",
      },
    ],
    edges: [
      { id: "fc-e1", source: "fc-start", target: "fc-process-1", kind: "routes-to" },
      { id: "fc-e2", source: "fc-process-1", target: "fc-decision-1", kind: "routes-to" },
      { id: "fc-e3", source: "fc-decision-1", target: "fc-process-2", kind: "routes-to", label: "Yes" },
      { id: "fc-e4", source: "fc-decision-1", target: "fc-process-3", kind: "routes-to", label: "No" },
      { id: "fc-e5", source: "fc-process-2", target: "fc-end", kind: "routes-to" },
      { id: "fc-e6", source: "fc-process-3", target: "fc-end", kind: "routes-to" },
    ],
  };
}

export const DECISION_KINDS: NodeKind[] = ["decision"];
