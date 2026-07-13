import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, flashcardSets, flashcards } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface FlashcardInput {
  id: string;
  front: string;
  back: string;
}

/**
 * Load a flashcard set by id. Owners get full access; anyone else only if
 * it's public.
 */
export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const set = await db.query.flashcardSets.findFirst({
    where: eq(flashcardSets.id, id),
    with: {
      cards: { orderBy: (c, { asc }) => [asc(c.sortOrder)] },
      owner: { columns: { name: true } },
    },
  });
  if (!set) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isOwner = set.ownerId === userId;
  if (!isOwner && set.visibility !== "public") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (isOwner) {
    await db.update(flashcardSets).set({ lastOpenedAt: new Date() }).where(eq(flashcardSets.id, id));
  }

  return NextResponse.json({
    id: set.id,
    name: set.name,
    description: set.description,
    visibility: set.visibility,
    folderId: set.folderId,
    cards: set.cards.map((c) => ({ id: c.cardId, front: c.front, back: c.back })),
    isOwner,
    ownerName: set.owner.name,
  });
}

/**
 * Update a flashcard set. Owner only.
 */
export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [set] = await db
    .select({ ownerId: flashcardSets.ownerId })
    .from(flashcardSets)
    .where(eq(flashcardSets.id, id))
    .limit(1);
  if (!set || set.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    cards?: FlashcardInput[];
    visibility?: "public" | "private";
    folderId?: string | null;
  };

  await db.transaction(async (tx) => {
    await tx
      .update(flashcardSets)
      .set({
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.visibility ? { visibility: body.visibility } : {}),
        ...(body.folderId !== undefined ? { folderId: body.folderId } : {}),
        lastOpenedAt: new Date(),
      })
      .where(eq(flashcardSets.id, id));

    if (body.cards) {
      await tx.delete(flashcards).where(eq(flashcards.setId, id));
      if (body.cards.length > 0) {
        await tx.insert(flashcards).values(
          body.cards.map((c, i) => ({
            setId: id,
            cardId: c.id,
            front: c.front,
            back: c.back,
            sortOrder: i,
          })),
        );
      }
    }
  });

  return NextResponse.json({ ok: true });
}

/**
 * Delete a flashcard set. Owner only.
 */
export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [set] = await db
    .select({ ownerId: flashcardSets.ownerId })
    .from(flashcardSets)
    .where(eq(flashcardSets.id, id))
    .limit(1);
  if (!set || set.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.delete(flashcardSets).where(eq(flashcardSets.id, id));
  return NextResponse.json({ ok: true });
}
