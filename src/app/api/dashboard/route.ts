import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, diagrams, flashcardSets, users } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";

const RECENT_LIMIT = 6;
const POPULAR_LIMIT = 8;

interface DashboardItem {
  type: "diagram" | "flashcard-set";
  id: string;
  name: string;
  ownerName?: string;
  updatedAt: string;
}

/**
 * Dashboard summary: the current user's most recently opened items plus a
 * feed of public items from any user.
 */
export async function GET(): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [recentDiagrams, recentSets, popularDiagrams, popularSets] = await Promise.all([
    db
      .select({ id: diagrams.id, name: diagrams.name, lastOpenedAt: diagrams.lastOpenedAt })
      .from(diagrams)
      .where(eq(diagrams.ownerId, userId))
      .orderBy(desc(diagrams.lastOpenedAt))
      .limit(RECENT_LIMIT),
    db
      .select({ id: flashcardSets.id, name: flashcardSets.name, lastOpenedAt: flashcardSets.lastOpenedAt })
      .from(flashcardSets)
      .where(eq(flashcardSets.ownerId, userId))
      .orderBy(desc(flashcardSets.lastOpenedAt))
      .limit(RECENT_LIMIT),
    db
      .select({
        id: diagrams.id,
        name: diagrams.name,
        updatedAt: diagrams.updatedAt,
        ownerName: users.name,
      })
      .from(diagrams)
      .innerJoin(users, eq(users.id, diagrams.ownerId))
      .where(eq(diagrams.visibility, "public"))
      .orderBy(desc(diagrams.updatedAt))
      .limit(POPULAR_LIMIT),
    db
      .select({
        id: flashcardSets.id,
        name: flashcardSets.name,
        updatedAt: flashcardSets.updatedAt,
        ownerName: users.name,
      })
      .from(flashcardSets)
      .innerJoin(users, eq(users.id, flashcardSets.ownerId))
      .where(eq(flashcardSets.visibility, "public"))
      .orderBy(desc(flashcardSets.updatedAt))
      .limit(POPULAR_LIMIT),
  ]);

  const recent: DashboardItem[] = [
    ...recentDiagrams.map((d) => ({
      type: "diagram" as const,
      id: d.id,
      name: d.name,
      updatedAt: d.lastOpenedAt.toISOString(),
    })),
    ...recentSets.map((s) => ({
      type: "flashcard-set" as const,
      id: s.id,
      name: s.name,
      updatedAt: s.lastOpenedAt.toISOString(),
    })),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, RECENT_LIMIT);

  const popular: DashboardItem[] = [
    ...popularDiagrams.map((d) => ({
      type: "diagram" as const,
      id: d.id,
      name: d.name,
      ownerName: d.ownerName,
      updatedAt: d.updatedAt.toISOString(),
    })),
    ...popularSets.map((s) => ({
      type: "flashcard-set" as const,
      id: s.id,
      name: s.name,
      ownerName: s.ownerName,
      updatedAt: s.updatedAt.toISOString(),
    })),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, POPULAR_LIMIT);

  return NextResponse.json({ recent, popular });
}
