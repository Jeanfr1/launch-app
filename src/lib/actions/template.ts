"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import {
  computeStages,
  computeTaskDate,
  fimDeVendas,
  isMonday,
  segundaDaSemana,
  type DateContext,
  type StageDef,
} from "@/lib/date-engine";
import { TEMPLATE_PADRAO } from "@/lib/template-seed";
import type { Database } from "@/lib/supabase/database.types";

type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];

export type ResultadoTemplate =
  | { ok: true; projectId: string; tarefas: number }
  | { ok: false; erro: string };

const schema = z.object({
  nome: z.string().trim().min(2, "Informe um nome com ao menos 2 caracteres."),
  data_inicio_vendas: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
});

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Cria um projeto a partir do template padrão: clona as 10 etapas e as 432
 * tarefas reais, com todas as datas calculadas pelo motor de datas.
 */
export async function criarProjetoDoTemplate(input: unknown): Promise<ResultadoTemplate> {
  const user = await requireUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const inicio = isMonday(parsed.data.data_inicio_vendas)
    ? parsed.data.data_inicio_vendas
    : segundaDaSemana(parsed.data.data_inicio_vendas);
  const fim = fimDeVendas(inicio);
  const supabase = await createClient();

  // 1) Projeto (o trigger adiciona o criador como owner).
  const { data: projeto, error: erroProjeto } = await supabase
    .from("projects")
    .insert({
      nome: parsed.data.nome,
      data_inicio_vendas: inicio,
      data_fim_vendas: fim,
      status: "planejamento",
      created_by: user.id,
    })
    .select("id")
    .single();
  if (erroProjeto || !projeto) {
    return { ok: false, erro: erroProjeto?.message ?? "Falha ao criar projeto." };
  }

  // 2) Etapas com datas calculadas.
  const stageDefs: StageDef[] = TEMPLATE_PADRAO.stages.map((s) => ({
    nome: s.nome,
    ordem: s.ordem,
    ancora: s.ancora,
    offset_dias: s.offset_dias,
    duracao_dias: s.duracao_dias ?? null,
  }));
  const computed = computeStages(inicio, stageDefs);

  const { data: etapas, error: erroEtapas } = await supabase
    .from("stages")
    .insert(
      computed.map((s) => ({
        project_id: projeto.id,
        nome: s.nome,
        ordem: s.ordem,
        ancora: s.ancora,
        offset_dias: s.offset_dias,
        data_inicio: s.data_inicio,
        data_fim: s.data_fim,
      })),
    )
    .select("id, ordem, data_inicio, data_fim");
  if (erroEtapas || !etapas) {
    return { ok: false, erro: `Etapas: ${erroEtapas?.message ?? "falha"}` };
  }
  const etapaPorOrdem = new Map(etapas.map((e) => [e.ordem, e]));

  // 3) Tarefas com data_calculada por âncora da etapa/vendas.
  const tarefas: TaskInsert[] = [];
  for (const stage of TEMPLATE_PADRAO.stages) {
    const et = etapaPorOrdem.get(stage.ordem);
    if (!et) continue;
    const ctx: DateContext = {
      inicio_vendas: inicio,
      fim_vendas: fim,
      inicio_etapa: et.data_inicio,
      fim_etapa: et.data_fim,
      milestones: {}, // marcos (CPLs/lives) são definidos depois no projeto
    };
    for (const t of stage.tasks) {
      tarefas.push({
        project_id: projeto.id,
        stage_id: et.id,
        subetapa: t.subetapa,
        titulo: t.titulo,
        descricao_operacional: t.descricao_operacional,
        canal: t.canal,
        dependencia_texto: t.dependencia_texto,
        data_ancora_tipo: t.data_ancora_tipo,
        regra_data: t.regra_data,
        data_calculada: computeTaskDate(t.data_ancora_tipo, t.regra_data, ctx),
        recorrencia: t.recorrencia,
        prioridade: t.prioridade,
        status: "a_fazer",
        automacao: t.automacao,
        ferramenta: t.ferramenta,
        observacoes: t.observacoes,
        visivel_cliente: false,
        ordem_kanban: t.ordem,
      });
    }
  }

  for (const lote of chunk(tarefas, 200)) {
    const { error } = await supabase.from("tasks").insert(lote);
    if (error) {
      return { ok: false, erro: `Tarefas: ${error.message}` };
    }
  }

  await supabase.from("activity_log").insert({
    project_id: projeto.id,
    actor_id: user.id,
    entidade: "project",
    entidade_id: projeto.id,
    acao: "criado_do_template",
    detalhes: { nome: parsed.data.nome, tarefas: tarefas.length },
  });

  revalidatePath("/");
  return { ok: true, projectId: projeto.id, tarefas: tarefas.length };
}
