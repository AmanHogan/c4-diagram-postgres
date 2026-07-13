import { NextResponse } from "next/server";
import { count, desc, eq, ilike, or } from "drizzle-orm";
import { db, diagrams, flashcardSets, flashcards, users } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";

const RESULT_LIMIT = 20;

/**
 * Search diagrams, flashcard sets, and users by name.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ diagrams: [], flashcardSets: [], users: [] });
  }

  const pattern = `%${q}%`;

  const [diagramResults, setResults, userResults] = await Promise.all([
    db
      .select({
        id: diagrams.id,
        name: diagrams.name,
        visibility: diagrams.visibility,
        updatedAt: diagrams.updatedAt,
        ownerId: diagrams.ownerId,
        ownerName: users.name,
      })
      .from(diagrams)
      .innerJoin(users, eq(users.id, diagrams.ownerId))
      .where(
        or(
          eq(diagrams.ownerId, userId),
          eq(diagrams.visibility, "public"),
        ),
      )
      .orderBy(desc(diagrams.updatedAt))
      .limit(RESULT_LIMIT)
      .then((rows) => rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))),
    db
      .select({
        id: flashcardSets.id,
        name: flashcardSets.name,
        description: flashcardSets.description,
        visibility: flashcardSets.visibility,
        updatedAt: flashcardSets.updatedAt,
        ownerId: flashcardSets.ownerId,
        ownerName: users.name,
        cardCount: count(flashcards.id),
      })
      .from(flashcardSets)
      .innerJoin(users, eq(users.id, flashcardSets.ownerId))
      .leftJoin(flashcards, eq(flashcards.setId, flashcardSets.id))
      .where(
        or(
          eq(flashcardSets.ownerId, userId),
          eq(flashcardSets.visibility, "public"),
        ),
      )
      .groupBy(flashcardSets.id, users.name)
      .orderBy(desc(flashcardSets.updatedAt))
      .limit(RESULT_LIMIT * 2)
      .then((rows) => rows.filter((r) => r.name.toLowerCase().includes(q.toLowerCase())).slice(0, RESULT_LIMIT)),
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(ilike(users.name, pattern))
      .limit(RESULT_LIMIT),
  ]);

  return NextResponse.json({
    diagrams: diagramResults.map((d) => ({
      id: d.id,
      name: d.name,
      visibility: d.visibility,
      ownerName: d.ownerName,
      isOwner: d.ownerId === userId,
      updatedAt: d.updatedAt,
    })),
    flashcardSets: setResults.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      visibility: s.visibility,
      ownerName: s.ownerName,
      isOwner: s.ownerId === userId,
      cardCount: s.cardCount,
      updatedAt: s.updatedAt,
    })),
    users: userResults.map((u) => ({ id: u.id, name: u.name })),
  });
}
