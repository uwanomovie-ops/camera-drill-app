import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { questions } from "@/src/db/schema";
import { eq, asc } from "drizzle-orm";

// セット内の問題一覧を取得
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await db
    .select()
    .from(questions)
    .where(eq(questions.setId, Number(id)))
    .orderBy(asc(questions.orderIndex));

  return NextResponse.json(rows);
}
