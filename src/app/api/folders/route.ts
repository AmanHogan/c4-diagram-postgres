import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, folders } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";

/**
 * List the current user's folders.
 */
export async function GET(): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({ id: folders.id, name: folders.name })
    .from(folders)
    .where(eq(folders.ownerId, userId))
    .orderBy(asc(folders.name));

  return NextResponse.json(rows);
}

/**
 * Create a new folder owned by the current user.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = (await request.json()) as { name?: string };
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [folder] = await db
    .insert(folders)
    .values({ name: name.trim(), ownerId: userId })
    .returning({ id: folders.id, name: folders.name });

  return NextResponse.json({ id: folder.id, name: folder.name });
}
