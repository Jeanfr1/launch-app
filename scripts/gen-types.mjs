#!/usr/bin/env node
// Regenera src/lib/supabase/database.types.ts a partir do schema live.
// Uso: node --env-file=.env.local scripts/gen-types.mjs

import { writeFileSync } from "node:fs";
import { join } from "node:path";

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF;
if (!TOKEN || !REF) {
  console.error("Faltam SUPABASE_ACCESS_TOKEN e/ou SUPABASE_PROJECT_REF.");
  process.exit(1);
}

const res = await fetch(
  `https://api.supabase.com/v1/projects/${REF}/types/typescript?included_schemas=public`,
  {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "User-Agent": "launchapp-gen-types",
    },
  },
);
if (!res.ok) {
  console.error(`HTTP ${res.status}\n${await res.text()}`);
  process.exit(1);
}
const { types } = await res.json();
const out = join(process.cwd(), "src", "lib", "supabase", "database.types.ts");
writeFileSync(out, types);
console.log(`✓ tipos gravados em ${out}`);
