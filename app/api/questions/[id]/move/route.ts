import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { questions } from "@/src/db/schema";
import { eq, asc } from "drizzle-orm";

// direction: "up" | "down"
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { direction } = await request.json();

  const target = await db
    .select()
    .from(questions)
    .where(eq(questions.id, Number(id)))
    .then((r) => r[0]);

  if (!target || target.setId === null) {
    return NextResponse.json({ error: "問題が見つかりません" }, { status: 404 });
  }

  const siblings = await db
    .select()
    .from(questions)
    .where(eq(questions.setId, target.setId))
    .orderBy(asc(questions.orderIndex));

  const currentIdx = siblings.findIndex((q) => q.id === target.id);
  const swapIdx = direction === "up" ? currentIdx - 1 : currentIdx + 1;

  if (swapIdx < 0 || swapIdx >= siblings.length) {
    return NextResponse.json({ error: "移動できません" }, { status: 400 });
  }

  const swapTarget = siblings[swapIdx];

  await db
    .update(questions)
    .set({ orderIndex: swapTarget.orderIndex })
    .where(eq(questions.id, target.id));

  await db
    .update(questions)
    .set({ orderIndex: target.orderIndex })
    .where(eq(questions.id, swapTarget.id));

  return NextResponse.json({ success: true });
}
