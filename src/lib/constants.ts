import type { Database } from "@/lib/supabase/database.types";

export type StatusTarefa = Database["public"]["Enums"]["status_tarefa"];
export type Prioridade = Database["public"]["Enums"]["prioridade"];

/** Ordem e rótulos das colunas do Kanban. */
export const STATUS_ORDEM: StatusTarefa[] = [
  "backlog",
  "a_fazer",
  "em_andamento",
  "em_revisao",
  "aguardando_aprovacao",
  "concluido",
  "bloqueado",
];

export const STATUS_LABEL: Record<StatusTarefa, string> = {
  backlog: "Backlog",
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  em_revisao: "Em revisão",
  aguardando_aprovacao: "Aguardando aprovação",
  concluido: "Concluído",
  bloqueado: "Bloqueado",
};

/** Classe de cor da bolinha/realce de cada coluna. */
export const STATUS_COR: Record<StatusTarefa, string> = {
  backlog: "bg-slate-400",
  a_fazer: "bg-sky-400",
  em_andamento: "bg-indigo-400",
  em_revisao: "bg-violet-400",
  aguardando_aprovacao: "bg-amber-400",
  concluido: "bg-emerald-400",
  bloqueado: "bg-rose-400",
};

export const PRIORIDADE_ORDEM: Prioridade[] = ["baixa", "media", "alta", "urgente"];

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

/** Cor da borda-lateral e badge por prioridade (vermelho=urgente/alta, amarelo=média, cinza=baixa). */
export const PRIORIDADE_COR: Record<Prioridade, string> = {
  baixa: "border-l-slate-400",
  media: "border-l-amber-400",
  alta: "border-l-orange-500",
  urgente: "border-l-rose-500",
};

export const PRIORIDADE_BADGE: Record<Prioridade, string> = {
  baixa: "bg-slate-500/15 text-slate-400",
  media: "bg-amber-500/15 text-amber-500",
  alta: "bg-orange-500/15 text-orange-500",
  urgente: "bg-rose-500/15 text-rose-500",
};

export const STATUS_PROJETO_LABEL: Record<string, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  arquivado: "Arquivado",
};

/** dd/mm/aaaa a partir de 'yyyy-MM-dd' (ou null). */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
