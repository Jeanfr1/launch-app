import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

// Diagnóstico temporário de auth/RLS. Remover depois.
function decodeJwt(t?: string): Record<string, unknown> | null {
  if (!t) return null;
  try {
    const payload = t.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64").toString());
  } catch {
    return null;
  }
}

export async function GET() {
  const { user, supabase } = await requireUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const payload = decodeJwt(session?.access_token);

  // leitura
  const read = await supabase.from("projects").select("id").limit(1);

  // insert de teste (limpo em seguida)
  const ins = await supabase
    .from("projects")
    .insert({
      nome: "__diag__",
      data_inicio_vendas: "2026-09-14",
      data_fim_vendas: "2026-09-20",
      created_by: user.id,
    })
    .select("id");
  const id = ins.data?.[0]?.id;
  let cleaned = false;
  if (id) {
    await supabase.from("projects").delete().eq("id", id);
    cleaned = true;
  }

  return NextResponse.json({
    userId: user.id,
    hasToken: !!session?.access_token,
    tokenRole: payload?.role ?? null,
    tokenSub: payload?.sub ?? null,
    subMatchesUser: payload?.sub === user.id,
    readErr: read.error?.message ?? null,
    readCount: read.data?.length ?? null,
    insertOk: !!id,
    insertErr: ins.error?.message ?? null,
    cleaned,
  });
}
