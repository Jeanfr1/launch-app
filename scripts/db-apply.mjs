#!/usr/bin/env node
// Aplica as migrations SQL de supabase/migrations/ no projeto Supabase,
// em ordem alfabética, via Management API. Idempotente o suficiente para
// desenvolvimento (as migrations usam IF NOT EXISTS / guards).
//
// Requer no ambiente: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF.
// Uso: node --env-file=.env.local scripts/db-apply.mjs [arquivo.sql]

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF;
if (!TOKEN || !REF) {
  console.error("Faltam SUPABASE_ACCESS_TOKEN e/ou SUPABASE_PROJECT_REF.");
  process.exit(1);
}

const dir = join(process.cwd(), "supabase", "migrations");
const only = process.argv[2];
const files = only
  ? [only.replace(/^.*migrations\//, "")]
  : readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

for (const f of files) {
  const sql = readFileSync(join(dir, f), "utf8");
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "launchapp-db-apply",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  if (!res.ok) {
    console.error(`✗ ${f}: HTTP ${res.status}\n${await res.text()}`);
    process.exit(1);
  }
  console.log(`✓ ${f}`);
}
console.log("Migrations aplicadas.");
