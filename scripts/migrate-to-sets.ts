import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { questionSets, questions } from "../src/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: { questionSets, questions } });

const CATEGORIES = ["露出", "レンズ", "構図", "ライティング", "カメラの仕組み"];

async function main() {
  console.log("既存問題をデフォルトセットに移行します...");

  for (const category of CATEGORIES) {
    const categoryQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.category, category));

    if (categoryQuestions.length === 0) {
      console.log(`  ${category}: 問題なし → スキップ`);
      continue;
    }

    const [newSet] = await db
      .insert(questionSets)
      .values({ name: `${category} セット1`, category, orderIndex: 0 })
      .returning();

    for (let i = 0; i < categoryQuestions.length; i++) {
      await db
        .update(questions)
        .set({ setId: newSet.id, orderIndex: i })
        .where(eq(questions.id, categoryQuestions[i].id));
    }

    console.log(`  ${category}: セット「${newSet.name}」(id=${newSet.id}) に ${categoryQuestions.length}問 を割り当て`);
  }

  console.log("移行完了！");
}

main().catch(console.error);
