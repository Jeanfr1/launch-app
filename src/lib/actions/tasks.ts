"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { STATUS_ORDEM, PRIORIDADE_ORDEM } from "@/lib/constants";
import type { StatusTarefa, Prioridade } from "@/lib/constants";
import type { Database } from "@/lib/supabase/database.types";
import { computeTaskDate, type DateContext } from "@/lib/date-engine";

type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

const statusEnum = z.enum(STATUS_ORDEM as [string, ...string[]]);
const prioridadeEnum = z.enum(PRIORIDADE_ORDEM as [string, ...string[]]);

export type ResultadoTarefa =
  | { ok: true; taskId: string }
  | { ok: true }
  | { ok: false; erro: string };

const criarSchema = z.object({
  project_id: z.string().uuid(),
  stage_id: z.string().uuid().nullable().optional(),
  titulo: z.string().trim().min(2, "Título muito curto."),
  subetapa: z.string().trim().optional(),
  canal: z.string().trim().optional(),
  prioridade: prioridadeEnum.default("media"),
  status: statusEnum.default("a_fazer"),
  responsavel_id: z.string().uuid().nullable().optional(),
  data_ancora_tipo: z.string().default("inicio_etapa"),
  regra_data: z.string().default("no_dia"),
  visivel_cliente: z.boolean().default(false),
  story_points: z.number().int().min(0).max(100).nullable().optional(),
});

/** Cria uma tarefa e já calcula a data via motor de datas (âncora da etapa/vendas). */
export async function criarTarefa(input: unknown): Promise<ResultadoTarefa> {
  const { user, supabase } = await requireUser();
  const parsed = criarSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  // Monta o contexto de datas a partir do projeto, da etapa e dos marcos.
  const [{ data: projeto }, { data: etapa }, { data: marcos }] = await Promise.all([
    supabase
      .from("projects")
      .select("data_inicio_vendas, data_fim_vendas")
      .eq("id", d.project_id)
      .single(),
    d.stage_id
      ? supabase.from("stages").select("data_inicio, data_fim").eq("id", d.stage_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("project_milestones").select("chave, data").eq("project_id", d.project_id),
  ]);

  let data_calculada: string | null = null;
  if (projeto) {
    const ctx: DateContext = {
      inicio_vendas: projeto.data_inicio_vendas,
      fim_vendas: projeto.data_fim_vendas,
      inicio_etapa: etapa?.data_inicio,
      fim_etapa: etapa?.data_fim,
      milestones: Object.fromEntries((marcos ?? []).map((m) => [m.chave, m.data])),
    };
    data_calculada = computeTaskDate(d.data_ancora_tipo, d.regra_data, ctx);
  }

  const { data: nova, error } = await supabase
    .from("tasks")
    .insert({
      project_id: d.project_id,
      stage_id: d.stage_id ?? null,
      titulo: d.titulo,
      subetapa: d.subetapa || null,
      canal: d.canal || null,
      prioridade: d.prioridade as Prioridade,
      status: d.status as StatusTarefa,
      responsavel_id: d.responsavel_id ?? null,
      data_ancora_tipo: d.data_ancora_tipo,
      regra_data: d.regra_data,
      data_calculada,
      visivel_cliente: d.visivel_cliente,
      story_points: d.story_points ?? null,
    })
    .select("id")
    .single();

  if (error || !nova) return { ok: false, erro: error?.message ?? "Falha ao criar tarefa." };

  await supabase.from("activity_log").insert({
    project_id: d.project_id,
    actor_id: user.id,
    entidade: "task",
    entidade_id: nova.id,
    acao: "criada",
    detalhes: { titulo: d.titulo },
  });

  revalidatePath(`/projetos/${d.project_id}`);
  return { ok: true, taskId: nova.id };
}

const moverSchema = z.object({
  taskId: z.string().uuid(),
  project_id: z.string().uuid(),
  status: statusEnum,
  ordem_kanban: z.number(),
});

/** Move a tarefa no Kanban: novo status + posição (ordem_kanban fracionária). */
export async function moverTarefa(input: unknown): Promise<ResultadoTarefa> {
  const { user, supabase } = await requireUser();
  const parsed = moverSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "Movimento inválido." };
  const { taskId, project_id, status, ordem_kanban } = parsed.data;

  const { data: antes } = await supabase
    .from("tasks")
    .select("status")
    .eq("id", taskId)
    .single();

  const { error } = await supabase
    .from("tasks")
    .update({ status: status as StatusTarefa, ordem_kanban })
    .eq("id", taskId);
  if (error) return { ok: false, erro: error.message };

  if (antes && antes.status !== status) {
    await supabase.from("activity_log").insert({
      project_id,
      actor_id: user.id,
      entidade: "task",
      entidade_id: taskId,
      acao: "status_alterado",
      detalhes: { de: antes.status, para: status },
    });
  }

  revalidatePath(`/projetos/${project_id}`);
  return { ok: true };
}

const atualizarSchema = z.object({
  taskId: z.string().uuid(),
  project_id: z.string().uuid(),
  patch: z
    .object({
      titulo: z.string().trim().min(2).optional(),
      status: statusEnum.optional(),
      prioridade: prioridadeEnum.optional(),
      responsavel_id: z.string().uuid().nullable().optional(),
      visivel_cliente: z.boolean().optional(),
      story_points: z.number().int().min(0).max(100).nullable().optional(),
    })
    .refine((p) => Object.keys(p).length > 0, "Nada para atualizar."),
});

/** Edição inline de campos da tarefa. */
export async function atualizarTarefa(input: unknown): Promise<ResultadoTarefa> {
  const { supabase } = await requireUser();
  const parsed = atualizarSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { taskId, project_id, patch } = parsed.data;
  const { error } = await supabase
    .from("tasks")
    .update(patch as TaskUpdate)
    .eq("id", taskId);
  if (error) return { ok: false, erro: error.message };
  revalidatePath(`/projetos/${project_id}`);
  return { ok: true };
}

const excluirSchema = z.object({
  taskId: z.string().uuid(),
  project_id: z.string().uuid(),
});

export async function excluirTarefa(input: unknown): Promise<ResultadoTarefa> {
  const { user, supabase } = await requireUser();
  const parsed = excluirSchema.safeParse(input);
  if (!parsed.success) return { ok: false, erro: "Dados inválidos." };
  const { taskId, project_id } = parsed.data;
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) return { ok: false, erro: error.message };
  await supabase.from("activity_log").insert({
    project_id,
    actor_id: user.id,
    entidade: "task",
    entidade_id: taskId,
    acao: "excluida",
  });
  revalidatePath(`/projetos/${project_id}`);
  return { ok: true };
}
