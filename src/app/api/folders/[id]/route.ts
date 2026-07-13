import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { db, folders, diagrams, flashcardSets, flashcards } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Load a folder and the diagrams/flashcard sets it contains. Owner only.
 */
export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [folder] = await db
    .select()
    .from(folders)
    .where(eq(folders.id, id))
    .limit(1);
  if (!folder || folder.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [folderDiagrams, folderSets] = await Promise.all([
    db
      .select({
        id: diagrams.id,
        name: diagrams.name,
        visibility: diagrams.visibility,
        updatedAt: diagrams.updatedAt,
      })
      .from(diagrams)
      .where(and(eq(diagrams.folderId, id), eq(diagrams.ownerId, userId))),
    db
      .select({
        id: flashcardSets.id,
        name: flashcardSets.name,
        visibility: flashcardSets.visibility,
        updatedAt: flashcardSets.updatedAt,
        cardCount: count(flashcards.id),
      })
      .from(flashcardSets)
      .leftJoin(flashcards, eq(flashcards.setId, flashcardSets.id))
      .where(and(eq(flashcardSets.folderId, id), eq(flashcardSets.ownerId, userId)))
      .groupBy(flashcardSets.id),
  ]);

  return NextResponse.json({
    id: folder.id,
    name: folder.name,
    diagrams: folderDiagrams,
    flashcardSets: folderSets,
  });
}

/**
 * Rename a folder. Owner only.
 */
export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [folder] = await db
    .select({ ownerId: folders.ownerId })
    .from(folders)
    .where(eq(folders.id, id))
    .limit(1);
  if (!folder || folder.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { name } = (await request.json()) as { name?: string };
  if (name) {
    await db.update(folders).set({ name }).where(eq(folders.id, id));
  }
  return NextResponse.json({ ok: true });
}

/**
 * Delete a folder. Contained items are detached (kept, folderId cleared).
 */
export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [folder] = await db
    .select({ ownerId: folders.ownerId })
    .from(folders)
    .where(eq(folders.id, id))
    .limit(1);
  if (!folder || folder.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.transaction(async (tx) => {
    await tx.update(diagrams).set({ folderId: null }).where(eq(diagrams.folderId, id));
    await tx.update(flashcardSets).set({ folderId: null }).where(eq(flashcardSets.folderId, id));
    await tx.delete(folders).where(eq(folders.id, id));
  });

  return NextResponse.json({ ok: true });
}
