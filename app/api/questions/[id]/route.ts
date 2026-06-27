import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { questions } from "@/src/db/schema";
import { eq, asc } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { category, question, choices, answer, explanation, difficulty, type, setId, orderIndex, published } = body;

  const updateData: Partial<typeof questions.$inferInsert> = {
    category, question, choices, answer, explanation, difficulty, type,
  };
  if (setId !== undefined) updateData.setId = setId;
  if (orderIndex !== undefined) updateData.orderIndex = orderIndex;
  if (published !== undefined) updateData.published = published;

  const [updated] = await db
    .update(questions)
    .set(updateData)
    .where(eq(questions.id, Number(id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "問題が見つかりません" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await db.delete(questions).where(eq(questions.id, Number(id)));

  return NextResponse.json({ success: true });
}
