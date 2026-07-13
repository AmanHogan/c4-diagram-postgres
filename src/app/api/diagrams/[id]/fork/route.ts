import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, diagrams, diagramNodes, diagramEdges } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Duplicate a public diagram into the current user's account as a private,
 * editable copy.
 */
export async function POST(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const original = await db.query.diagrams.findFirst({
    where: eq(diagrams.id, id),
    with: {
      nodes: { orderBy: (n, { asc }) => [asc(n.sortOrder)] },
      edges: { orderBy: (e, { asc }) => [asc(e.sortOrder)] },
    },
  });
  if (!original) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (original.visibility !== "public" && original.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let copyName = `${original.name} (copy)`;
  let suffix = 2;
  while (true) {
    const [dup] = await db
      .select({ id: diagrams.id })
      .from(diagrams)
      .where(and(eq(diagrams.ownerId, userId), eq(diagrams.name, copyName)))
      .limit(1);
    if (!dup) break;
    copyName = `${original.name} (copy ${suffix})`;
    suffix += 1;
  }

  const [fork] = await db
    .insert(diagrams)
    .values({
      name: copyName,
      ownerId: userId,
      visibility: "private",
      forkedFromId: original.id,
    })
    .returning({ id: diagrams.id });

  if (original.nodes.length > 0) {
    await db.insert(diagramNodes).values(
      original.nodes.map((n, i) => ({
        diagramId: fork.id,
        nodeId: n.nodeId,
        kind: n.kind,
        label: n.label,
        parentId: n.parentId,
        expanded: n.expanded,
        positionX: n.positionX,
        positionY: n.positionY,
        sizeWidth: n.sizeWidth,
        sizeHeight: n.sizeHeight,
        collapsedWidth: n.collapsedWidth,
        collapsedHeight: n.collapsedHeight,
        description: n.description,
        shape: n.shape,
        fillColor: n.fillColor,
        borderStyle: n.borderStyle,
        sortOrder: i,
      })),
    );
  }

  if (original.edges.length > 0) {
    await db.insert(diagramEdges).values(
      original.edges.map((e, i) => ({
        diagramId: fork.id,
        edgeId: e.edgeId,
        source: e.source,
        target: e.target,
        kind: e.kind,
        label: e.label,
        lineStyle: e.lineStyle,
        arrowStyle: e.arrowStyle,
        sortOrder: i,
      })),
    );
  }

  return NextResponse.json({ id: fork.id });
}
