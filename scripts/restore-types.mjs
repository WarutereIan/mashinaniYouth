import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = resolve(root, "scripts/types-response.json");
const outPath = resolve(root, "src/integrations/supabase/types.ts");
const { types } = JSON.parse(readFileSync(jsonPath, "utf8"));
writeFileSync(outPath, types, "utf8");
console.log("Wrote", outPath, types.length, "bytes");
