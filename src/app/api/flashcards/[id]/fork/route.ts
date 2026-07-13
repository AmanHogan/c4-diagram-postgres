import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, flashcardSets, flashcards } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Duplicate a public flashcard set into the current user's account as a
 * private, editable copy.
 */
export async function POST(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const original = await db.query.flashcardSets.findFirst({
    where: eq(flashcardSets.id, id),
    with: {
      cards: { orderBy: (c, { asc }) => [asc(c.sortOrder)] },
    },
  });
  if (!original) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (original.visibility !== "public" && original.ownerId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [fork] = await db
    .insert(flashcardSets)
    .values({
      name: `${original.name} (copy)`,
      description: original.description,
      ownerId: userId,
      visibility: "private",
      forkedFromId: original.id,
    })
    .returning({ id: flashcardSets.id });

  if (original.cards.length > 0) {
    await db.insert(flashcards).values(
      original.cards.map((c, i) => ({
        setId: fork.id,
        cardId: c.cardId,
        front: c.front,
        back: c.back,
        sortOrder: i,
      })),
    );
  }

  return NextResponse.json({ id: fork.id });
}
