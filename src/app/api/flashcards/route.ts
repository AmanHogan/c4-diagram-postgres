import { NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { db, flashcardSets, flashcards } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";

/**
 * List the current user's flashcard sets, most recently opened first.
 */
export async function GET(): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sets = await db
    .select({
      id: flashcardSets.id,
      name: flashcardSets.name,
      description: flashcardSets.description,
      visibility: flashcardSets.visibility,
      updatedAt: flashcardSets.updatedAt,
      folderId: flashcardSets.folderId,
      cardCount: count(flashcards.id),
    })
    .from(flashcardSets)
    .leftJoin(flashcards, eq(flashcards.setId, flashcardSets.id))
    .where(eq(flashcardSets.ownerId, userId))
    .groupBy(flashcardSets.id)
    .orderBy(desc(flashcardSets.lastOpenedAt));

  return NextResponse.json(sets);
}

/**
 * Create a new flashcard set owned by the current user.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, visibility, folderId } = (await request.json()) as {
    name?: string;
    description?: string;
    visibility?: "public" | "private";
    folderId?: string | null;
  };
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [set] = await db
    .insert(flashcardSets)
    .values({
      name: name.trim(),
      description,
      ownerId: userId,
      visibility: visibility ?? "private",
      folderId: folderId ?? null,
    })
    .returning({ id: flashcardSets.id });

  return NextResponse.json({ id: set.id });
}
