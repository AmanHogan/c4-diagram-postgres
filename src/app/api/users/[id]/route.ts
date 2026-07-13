import { NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { db, users, diagrams, flashcardSets, flashcards } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Public profile: a user's name plus their public diagrams and flashcard sets.
 */
export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const viewerId = await requireUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [user] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [userDiagrams, userSets] = await Promise.all([
    db
      .select({
        id: diagrams.id,
        name: diagrams.name,
        updatedAt: diagrams.updatedAt,
      })
      .from(diagrams)
      .where(eq(diagrams.ownerId, id))
      .orderBy(desc(diagrams.updatedAt)),
    db
      .select({
        id: flashcardSets.id,
        name: flashcardSets.name,
        updatedAt: flashcardSets.updatedAt,
        cardCount: count(flashcards.id),
      })
      .from(flashcardSets)
      .leftJoin(flashcards, eq(flashcards.setId, flashcardSets.id))
      .where(eq(flashcardSets.ownerId, id))
      .groupBy(flashcardSets.id)
      .orderBy(desc(flashcardSets.updatedAt)),
  ]);

  return NextResponse.json({
    id: user.id,
    name: user.name,
    diagrams: userDiagrams,
    flashcardSets: userSets,
  });
}
