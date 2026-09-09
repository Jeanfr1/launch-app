"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  computeStages,
  fimDeVendas,
  isMonday,
  segundaDaSemana,
} from "@/lib/date-engine";

const novoProjetoSchema = z.object({
  nome: z.string().trim().min(2, "Informe um nome com ao menos 2 caracteres."),
  data_inicio_vendas: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
});

export type ResultadoAcao =
  | { ok: true; projectId: string }
  | { ok: false; erro: string };

/**
 * Cria um projeto de lançamento e gera automaticamente as 10 etapas com datas
 * calculadas pelo motor de datas. A semana de Vendas é sempre normalizada para
 * começar numa segunda-feira.
 */
export async function criarProjeto(input: unknown): Promise<ResultadoAcao> {
  const { user, supabase } = await requireUser();

  const parsed = novoProjetoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { nome } = parsed.data;
  const inicio = isMonday(parsed.data.data_inicio_vendas)
    ? parsed.data.data_inicio_vendas
    : segundaDaSemana(parsed.data.data_inicio_vendas);
  const fim = fimDeVendas(inicio);

  const { data: projeto, error: erroProjeto } = await supabase
    .from("projects")
    .insert({
      nome,
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

  // Gera as etapas com datas calculadas.
  const etapas = computeStages(inicio).map((s) => ({
    project_id: projeto.id,
    nome: s.nome,
    ordem: s.ordem,
    ancora: s.ancora,
    offset_dias: s.offset_dias,
    data_inicio: s.data_inicio,
    data_fim: s.data_fim,
  }));

  const { error: erroEtapas } = await supabase.from("stages").insert(etapas);
  if (erroEtapas) {
    return { ok: false, erro: `Projeto criado, mas houve erro nas etapas: ${erroEtapas.message}` };
  }

  await supabase.from("activity_log").insert({
    project_id: projeto.id,
    actor_id: user.id,
    entidade: "project",
    entidade_id: projeto.id,
    acao: "criado",
    detalhes: { nome, data_inicio_vendas: inicio },
  });

  revalidatePath("/");
  return { ok: true, projectId: projeto.id };
}
