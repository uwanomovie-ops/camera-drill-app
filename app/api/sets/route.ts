import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { questionSets, questions } from "@/src/db/schema";
import { eq, asc, sql } from "drizzle-orm";

export async function GET() {
  const sets = await db
    .select({
      id: questionSets.id,
      name: questionSets.name,
      category: questionSets.category,
      orderIndex: questionSets.orderIndex,
      createdAt: questionSets.createdAt,
      questionCount: sql<number>`cast(count(${questions.id}) as int)`,
    })
    .from(questionSets)
    .leftJoin(questions, eq(questions.setId, questionSets.id))
    .groupBy(questionSets.id)
    .orderBy(asc(questionSets.category), asc(questionSets.orderIndex));

  return NextResponse.json(sets);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, category } = body;

  if (!name || !category) {
    return NextResponse.json({ error: "name と category は必須です" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(questionSets)
    .where(eq(questionSets.category, category))
    .orderBy(asc(questionSets.orderIndex));

  const orderIndex = existing.length;

  const [created] = await db
    .insert(questionSets)
    .values({ name, category, orderIndex })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
