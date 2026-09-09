import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

// Diagnóstico temporário de auth/RLS. Remover depois.
function decodeJwt(t?: string): Record<string, unknown> | null {
  if (!t) return null;
  try {
    return JSON.parse(Buffer.from(t.split(".")[1], "base64").toString());
  } catch {
    return null;
  }
}

export async function GET() {
  const { user, supabase } = await requireUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  const payload = decodeJwt(token);

  // (A) insert via supabase-js
  const insJs = await supabase
    .from("projects")
    .insert({
      nome: "__diagA__",
      data_inicio_vendas: "2026-09-14",
      data_fim_vendas: "2026-09-20",
      created_by: user.id,
    })
    .select("id");
  const idA = insJs.data?.[0]?.id;
  if (idA) await supabase.from("projects").delete().eq("id", idA);

  // (B) insert via REST manual com Authorization: Bearer explícito
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  let manualStatus = 0;
  let manualBody = "";
  try {
    const r = await fetch(`${url}/rest/v1/projects`, {
      method: "POST",
      headers: {
        apikey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        nome: "__diagB__",
        data_inicio_vendas: "2026-09-14",
        data_fim_vendas: "2026-09-20",
        created_by: user.id,
      }),
    });
    manualStatus = r.status;
    manualBody = (await r.text()).slice(0, 200);
    const parsed = JSON.parse(manualBody || "[]");
    const idB = Array.isArray(parsed) ? parsed[0]?.id : undefined;
    if (idB) {
      await fetch(`${url}/rest/v1/projects?id=eq.${idB}`, {
        method: "DELETE",
        headers: { apikey, Authorization: `Bearer ${token}` },
      });
    }
  } catch (e) {
    manualBody = String(e).slice(0, 200);
  }

  return NextResponse.json({
    userId: user.id,
    tokenRole: payload?.role ?? null,
    tokenIss: payload?.iss ?? null,
    tokenAlg: decodeJwt(token) && token ? JSON.parse(Buffer.from(token.split(".")[0], "base64").toString()).alg : null,
    jsInsertOk: !!idA,
    jsInsertErr: insJs.error?.message ?? null,
    manualStatus,
    manualBody,
  });
}
