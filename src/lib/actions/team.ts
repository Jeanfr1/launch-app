"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { FUNCOES_EQUIPE } from "@/lib/team";

const adicionarSchema = z.object({
  projectId: z.uuid(),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  papel: z.enum(FUNCOES_EQUIPE),
});
const removerSchema = z.object({ projectId: z.uuid(), userId: z.uuid().optional(), conviteId: z.uuid().optional() })
  .refine((v) => Boolean(v.userId) !== Boolean(v.conviteId));

function erroBanco(error: { code?: string; message: string }) {
  if (error.code === "PGRST202") return "A funcionalidade de equipe ainda precisa ser ativada no banco de dados.";
  if (error.code === "P0001") return error.message;
  return "Não foi possível atualizar a equipe. Tente novamente.";
}

export async function adicionarPessoa(input: unknown) {
  const { supabase } = await requireUser();
  const parsed = adicionarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, erro: "Informe um e-mail válido e uma função da equipe." };
  const { projectId, email, papel } = parsed.data;
  const { data, error } = await supabase.rpc("add_project_person", { p_project: projectId, p_email: email, p_role: papel });
  if (error) return { ok: false as const, erro: erroBanco(error) };
  revalidatePath(`/projetos/${projectId}`);
  return { ok: true as const, pendente: data === "pendente" };
}

export async function removerPessoa(input: unknown) {
  const { supabase } = await requireUser();
  const parsed = removerSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, erro: "Dados inválidos." };
  const { projectId, userId, conviteId } = parsed.data;
  const { error } = await supabase.rpc("remove_project_person", { p_project: projectId, p_user: userId, p_invitation: conviteId });
  if (error) return { ok: false as const, erro: erroBanco(error) };
  revalidatePath(`/projetos/${projectId}`);
  return { ok: true as const };
}
