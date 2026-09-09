import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Retorna o usuário autenticado (ou null). Valida no servidor. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Exige usuário autenticado e devolve TAMBÉM o client já autenticado.
 * Importante: reutilize este `supabase` para as operações de banco — assim a
 * sessão do usuário (JWT) fica anexada às requisições e o `auth.uid()` do RLS
 * funciona. Criar um client novo sem chamar getUser roda como `anon`.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { user, supabase };
}

/** Perfil do usuário autenticado (tabela profiles). */
export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data;
}
