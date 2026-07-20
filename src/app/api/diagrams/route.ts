import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, diagrams, diagramNodes, diagramEdges } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";
import { flowchartTemplate } from "@/lib/diagram-types";

/**
 * List the current user's diagrams, most recently opened first.
 */
export async function GET(): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: diagrams.id,
      name: diagrams.name,
      visibility: diagrams.visibility,
      updatedAt: diagrams.updatedAt,
      folderId: diagrams.folderId,
    })
    .from(diagrams)
    .where(eq(diagrams.ownerId, userId))
    .orderBy(desc(diagrams.lastOpenedAt));

  return NextResponse.json(rows);
}

/**
 * Create a new, empty diagram owned by the current user.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, visibility, folderId, template } = (await request.json()) as {
    name?: string;
    visibility?: "public" | "private";
    folderId?: string | null;
    template?: "flowchart";
  };
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: diagrams.id })
    .from(diagrams)
    .where(and(eq(diagrams.ownerId, userId), eq(diagrams.name, name.trim())))
    .limit(1);
  if (existing) {
    return NextResponse.json({ error: "You already have a diagram with that name" }, { status: 409 });
  }

  const [diagram] = await db
    .insert(diagrams)
    .values({
      name: name.trim(),
      ownerId: userId,
      visibility: visibility ?? "private",
      folderId: folderId ?? null,
    })
    .returning({ id: diagrams.id });

  if (template === "flowchart") {
    const seed = flowchartTemplate();
    await db.insert(diagramNodes).values(
      seed.nodes.map((n, i) => ({
        diagramId: diagram.id,
        nodeId: n.id,
        kind: n.kind,
        label: n.label,
        parentId: n.parentId,
        expanded: n.expanded,
        positionX: n.position.x,
        positionY: n.position.y,
        sizeWidth: n.size?.width ?? null,
        sizeHeight: n.size?.height ?? null,
        shape: n.shape ?? null,
        sortOrder: i,
      })),
    );
    await db.insert(diagramEdges).values(
      seed.edges.map((e, i) => ({
        diagramId: diagram.id,
        edgeId: e.id,
        source: e.source,
        target: e.target,
        kind: e.kind,
        label: e.label ?? null,
        sortOrder: i,
      })),
    );
  }

  return NextResponse.json({ id: diagram.id });
}
