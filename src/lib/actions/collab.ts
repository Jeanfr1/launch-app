"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

export type ResultadoCollab = { ok: true } | { ok: false; erro: string };

const comentarSchema = z.object({
  taskId: z.string().uuid(),
  projectId: z.string().uuid(),
  corpo: z.string().trim().min(1, "Escreva algo.").max(10000),
  visivelCliente: z.boolean().default(true),
});

export async function comentar(input: unknown): Promise<ResultadoCollab> {
  const { user, supabase } = await requireUser();
  const p = comentarSchema.safeParse(input);
  if (!p.success) return { ok: false, erro: p.error.issues[0]?.message ?? "Dados inválidos." };
  const { error } = await supabase.from("task_comments").insert({
    task_id: p.data.taskId,
    project_id: p.data.projectId,
    author_id: user.id,
    corpo: p.data.corpo,
    visivel_cliente: p.data.visivelCliente,
  });
  if (error) return { ok: false, erro: error.message };
  revalidatePath(`/projetos/${p.data.projectId}`);
  return { ok: true };
}

const pedirAprovacaoSchema = z.object({
  taskId: z.string().uuid(),
  projectId: z.string().uuid(),
  aprovadorId: z.string().uuid(),
});

export async function pedirAprovacao(input: unknown): Promise<ResultadoCollab> {
  const { supabase } = await requireUser();
  const p = pedirAprovacaoSchema.safeParse(input);
  if (!p.success) return { ok: false, erro: "Dados inválidos." };
  const { error } = await supabase.from("task_approvals").insert({
    task_id: p.data.taskId,
    project_id: p.data.projectId,
    aprovador_id: p.data.aprovadorId,
    status: "pendente",
  });
  if (error) return { ok: false, erro: error.message };
  revalidatePath(`/projetos/${p.data.projectId}`);
  return { ok: true };
}

const responderSchema = z.object({
  approvalId: z.string().uuid(),
  projectId: z.string().uuid(),
  status: z.enum(["aprovado", "reprovado"]),
  comentario: z.string().trim().max(2000).optional(),
});

export async function responderAprovacao(input: unknown): Promise<ResultadoCollab> {
  const { supabase } = await requireUser();
  const p = responderSchema.safeParse(input);
  if (!p.success) return { ok: false, erro: "Dados inválidos." };
  const { error } = await supabase
    .from("task_approvals")
    .update({ status: p.data.status, comentario: p.data.comentario ?? null })
    .eq("id", p.data.approvalId);
  if (error) return { ok: false, erro: error.message };
  revalidatePath(`/projetos/${p.data.projectId}`);
  return { ok: true };
}

const notaSchema = z.object({
  taskId: z.string().uuid(),
  projectId: z.string().uuid(),
  observacoes: z.string().max(20000).nullable(),
});

/** Observação interna (task_private) — só equipe. */
export async function salvarNotaInterna(input: unknown): Promise<ResultadoCollab> {
  const { supabase } = await requireUser();
  const p = notaSchema.safeParse(input);
  if (!p.success) return { ok: false, erro: "Dados inválidos." };
  const { error } = await supabase
    .from("task_private")
    .upsert(
      { task_id: p.data.taskId, project_id: p.data.projectId, observacoes: p.data.observacoes },
      { onConflict: "task_id" },
    );
  if (error) return { ok: false, erro: error.message };
  revalidatePath(`/projetos/${p.data.projectId}`);
  return { ok: true };
}
