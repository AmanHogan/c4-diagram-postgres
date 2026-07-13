import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, diagrams, diagramNodes, diagramEdges } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Load a diagram by id. Owners get full access; anyone else only if public.
 */
export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const diagram = await db.query.diagrams.findFirst({
    where: eq(diagrams.id, id),
    with: {
      nodes: { orderBy: (n, { asc }) => [asc(n.sortOrder)] },
      edges: { orderBy: (e, { asc }) => [asc(e.sortOrder)] },
      owner: { columns: { name: true } },
    },
  });
  if (!diagram) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isOwner = diagram.ownerId === userId;
  if (!isOwner && diagram.visibility !== "public") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (isOwner) {
    await db.update(diagrams).set({ lastOpenedAt: new Date() }).where(eq(diagrams.id, id));
  }

  return NextResponse.json({
    id: diagram.id,
    name: diagram.name,
    visibility: diagram.visibility,
    folderId: diagram.folderId,
    nodes: diagram.nodes.map((n) => ({
      id: n.nodeId,
      kind: n.kind,
      label: n.label,
      parentId: n.parentId,
      expanded: n.expanded,
      position: { x: n.positionX, y: n.positionY },
      size: n.sizeWidth != null ? { width: n.sizeWidth, height: n.sizeHeight } : undefined,
      collapsedSize: n.collapsedWidth != null ? { width: n.collapsedWidth, height: n.collapsedHeight } : undefined,
      description: n.description,
      shape: n.shape,
      fillColor: n.fillColor,
      borderStyle: n.borderStyle,
    })),
    edges: diagram.edges.map((e) => ({
      id: e.edgeId,
      source: e.source,
      target: e.target,
      kind: e.kind,
      label: e.label,
      lineStyle: e.lineStyle,
      arrowStyle: e.arrowStyle,
    })),
    isOwner,
    ownerName: diagram.owner.name,
  });
}

interface NodeInput {
  id: string;
  kind: string;
  label: string;
  parentId?: string | null;
  expanded?: boolean;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  collapsedSize?: { width: number; height: number };
  description?: string;
  shape?: string;
  fillColor?: string;
  borderStyle?: string;
}

interface EdgeInput {
  id: string;
  source: string;
  target: string;
  kind: string;
  label?: string;
  lineStyle?: string;
  arrowStyle?: string;
}

/**
 * Update a diagram's contents/name/visibility/folder. Owner only.
 */
export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [diagram] = await db
    .select({ ownerId: diagrams.ownerId })
    .from(diagrams)
    .where(eq(diagrams.id, id))
    .limit(1);
  if (!diagram || diagram.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    nodes?: NodeInput[];
    edges?: EdgeInput[];
    name?: string;
    visibility?: "public" | "private";
    folderId?: string | null;
  };

  await db.transaction(async (tx) => {
    await tx
      .update(diagrams)
      .set({
        ...(body.name ? { name: body.name } : {}),
        ...(body.visibility ? { visibility: body.visibility } : {}),
        ...(body.folderId !== undefined ? { folderId: body.folderId } : {}),
        lastOpenedAt: new Date(),
      })
      .where(eq(diagrams.id, id));

    if (body.nodes) {
      await tx.delete(diagramNodes).where(eq(diagramNodes.diagramId, id));
      if (body.nodes.length > 0) {
        await tx.insert(diagramNodes).values(
          body.nodes.map((n, i) => ({
            diagramId: id,
            nodeId: n.id,
            kind: n.kind,
            label: n.label,
            parentId: n.parentId ?? null,
            expanded: n.expanded ?? false,
            positionX: n.position.x,
            positionY: n.position.y,
            sizeWidth: n.size?.width ?? null,
            sizeHeight: n.size?.height ?? null,
            collapsedWidth: n.collapsedSize?.width ?? null,
            collapsedHeight: n.collapsedSize?.height ?? null,
            description: n.description ?? null,
            shape: n.shape ?? null,
            fillColor: n.fillColor ?? null,
            borderStyle: n.borderStyle ?? null,
            sortOrder: i,
          })),
        );
      }
    }

    if (body.edges) {
      await tx.delete(diagramEdges).where(eq(diagramEdges.diagramId, id));
      if (body.edges.length > 0) {
        await tx.insert(diagramEdges).values(
          body.edges.map((e, i) => ({
            diagramId: id,
            edgeId: e.id,
            source: e.source,
            target: e.target,
            kind: e.kind,
            label: e.label ?? null,
            lineStyle: e.lineStyle ?? null,
            arrowStyle: e.arrowStyle ?? null,
            sortOrder: i,
          })),
        );
      }
    }
  });

  return NextResponse.json({ ok: true });
}

/**
 * Delete a diagram. Owner only.
 */
export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [diagram] = await db
    .select({ ownerId: diagrams.ownerId })
    .from(diagrams)
    .where(eq(diagrams.id, id))
    .limit(1);
  if (!diagram || diagram.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.delete(diagrams).where(eq(diagrams.id, id));
  return NextResponse.json({ ok: true });
}
