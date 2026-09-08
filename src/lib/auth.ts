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

/** Exige usuário autenticado; redireciona para /login caso contrário. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
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
