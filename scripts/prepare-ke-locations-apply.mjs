import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** Apply all ke_locations seed chunks via one combined SQL file (idempotent). */
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sql = readFileSync(resolve(root, "scripts/.seed-chunks/all.sql"), "utf8");
writeFileSync(
  resolve(root, "scripts/.seed-chunks/_apply-payload.json"),
  JSON.stringify({ sql, bytes: sql.length }),
  "utf8",
);
console.log("payload bytes", sql.length);
