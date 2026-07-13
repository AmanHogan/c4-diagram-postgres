import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";

interface ThemePrefs {
  accent?: string;
  background?: string;
  card?: string;
}

/**
 * Load the current user's saved theme color overrides.
 */
export async function GET(): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select({
      themeAccent: users.themeAccent,
      themeBackground: users.themeBackground,
      themeCard: users.themeCard,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return NextResponse.json({
    accent: user?.themeAccent ?? undefined,
    background: user?.themeBackground ?? undefined,
    card: user?.themeCard ?? undefined,
  });
}

/**
 * Save the current user's theme color overrides.
 */
export async function PUT(request: Request): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const theme = (await request.json()) as ThemePrefs;
  await db
    .update(users)
    .set({
      themeAccent: theme.accent ?? null,
      themeBackground: theme.background ?? null,
      themeCard: theme.card ?? null,
    })
    .where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}
