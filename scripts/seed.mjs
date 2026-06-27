import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);

const questions = JSON.parse(
  readFileSync(join(__dir, "../src/data/questions.json"), "utf-8")
);

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log(`Seeding ${questions.length} questions...`);

  for (const q of questions) {
    await sql`
      INSERT INTO questions (category, question, choices, answer, explanation, difficulty, type)
      VALUES (
        ${q.category},
        ${q.question},
        ${JSON.stringify(q.choices)},
        ${q.answer},
        ${q.explanation},
        ${"medium"},
        ${"multiple_choice"}
      )
      ON CONFLICT DO NOTHING
    `;
    console.log(`  ✓ Q${q.id}: ${q.question.slice(0, 30)}...`);
  }

  console.log("Done!");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
