import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, flashcardProgress } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Load the current user's known/learning status for every card they've
 * studied in this set, keyed by card id.
 */
export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const entries = await db
    .select({ cardId: flashcardProgress.cardId, status: flashcardProgress.status })
    .from(flashcardProgress)
    .where(and(eq(flashcardProgress.userId, userId), eq(flashcardProgress.setId, id)));

  const progress: Record<string, string> = {};
  for (const entry of entries) {
    progress[entry.cardId] = entry.status;
  }
  return NextResponse.json(progress);
}

/**
 * Mark a single card known/learning for the current user.
 */
export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { cardId, status } = (await request.json()) as { cardId?: string; status?: "known" | "learning" };
  if (!cardId || (status !== "known" && status !== "learning")) {
    return NextResponse.json({ error: "cardId and a valid status are required" }, { status: 400 });
  }

  await db
    .insert(flashcardProgress)
    .values({ userId, setId: id, cardId, status })
    .onConflictDoUpdate({
      target: [flashcardProgress.userId, flashcardProgress.setId, flashcardProgress.cardId],
      set: { status, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
