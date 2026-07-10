import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = resolve(dirname(fileURLToPath(import.meta.url)), ".seed-chunks");
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? 14);
for (let i = start; i <= end; i++) {
  const file = resolve(dir, `chunk-${String(i).padStart(2, "0")}.sql`);
  const sql = readFileSync(file, "utf8");
  console.log(`===CHUNK ${i}===`);
  console.log(sql);
}
