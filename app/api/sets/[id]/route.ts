import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { questionSets } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name } = body;

  const [updated] = await db
    .update(questionSets)
    .set({ name })
    .where(eq(questionSets.id, Number(id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "セットが見つかりません" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await db.delete(questionSets).where(eq(questionSets.id, Number(id)));

  return NextResponse.json({ success: true });
}
