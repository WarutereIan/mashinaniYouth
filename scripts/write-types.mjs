import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Writes src/integrations/supabase/types.ts from MCP generate_typescript_types JSON output. */
const jsonPath = resolve(import.meta.dirname, process.argv[2] ?? "types-response.json");
const outPath = resolve(import.meta.dirname, "../src/integrations/supabase/types.ts");
const raw = jsonPath === "-" ? readFileSync(0, "utf8") : readFileSync(jsonPath, "utf8");
const { types } = JSON.parse(raw);
writeFileSync(outPath, types, "utf8");
console.log("Wrote", outPath, "bytes", types.length);
