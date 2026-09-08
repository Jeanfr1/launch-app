/**
 * Motor de datas — o coração do launchapp.
 *
 * Regra central: a etapa "Vendas" é o marco zero. Começa numa segunda-feira e
 * termina no domingo seguinte (7 dias). Todas as outras etapas são posicionadas
 * em relação a essa semana. Nenhuma data de tarefa é digitada à mão: é sempre
 * calculada a partir de uma Data Âncora + Regra de Deslocamento (D-n / D+n / no_dia).
 *
 * Este módulo é PURO (sem I/O, sem Supabase) para ser 100% testável.
 */

export type Ancora = "inicio_vendas" | "fim_vendas";

export type Recorrencia =
  | "nao"
  | "diario"
  | "diario_2x"
  | "a_cada_3_dias"
  | "a_cada_7_dias"
  | "semanal"
  | "rotineiro";

/** Uma etapa do template/projeto, com sua âncora e deslocamento em dias. */
export interface StageDef {
  nome: string;
  ordem: number;
  ancora: Ancora;
  offset_dias: number;
  /** Duração opcional; quando ausente, é inferida até a próxima etapa. */
  duracao_dias?: number | null;
}

export interface StageComputed extends StageDef {
  data_inicio: string; // yyyy-MM-dd
  data_fim: string; // yyyy-MM-dd
}

/**
 * Modelo macro padrão de 10 etapas (seção 5 da especificação).
 * offset em dias relativo ao início (segunda) OU ao fim (domingo) da semana de Vendas.
 */
export const MODELO_ETAPAS_PADRAO: StageDef[] = [
  { nome: "Onboarding / Concepção", ordem: 1, ancora: "inicio_vendas", offset_dias: -49 },
  { nome: "Distribuição de Conteúdo", ordem: 2, ancora: "inicio_vendas", offset_dias: -46 },
  { nome: "Captação de Leads", ordem: 3, ancora: "inicio_vendas", offset_dias: -28 },
  { nome: "Aquecimento", ordem: 4, ancora: "inicio_vendas", offset_dias: -21 },
  { nome: "Evento", ordem: 5, ancora: "inicio_vendas", offset_dias: -7 },
  { nome: "Vendas", ordem: 6, ancora: "inicio_vendas", offset_dias: 0, duracao_dias: 7 },
  { nome: "Onboarding de Alunos", ordem: 7, ancora: "inicio_vendas", offset_dias: 0 },
  { nome: "Reabertura", ordem: 8, ancora: "fim_vendas", offset_dias: 1 },
  { nome: "Debriefing", ordem: 9, ancora: "fim_vendas", offset_dias: 5 },
  { nome: "Downsell", ordem: 10, ancora: "fim_vendas", offset_dias: 10 },
];

// ── Utilitários de data (date-only, sem fuso) ────────────────────────────────

/** Converte 'yyyy-MM-dd' para Date local à meia-noite (evita drift de fuso). */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Formata Date como 'yyyy-MM-dd'. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function diffDays(aIso: string, bIso: string): number {
  const ms = parseISODate(aIso).getTime() - parseISODate(bIso).getTime();
  return Math.round(ms / 86_400_000);
}

/** 0 = domingo … 1 = segunda … 6 = sábado */
export function weekday(iso: string): number {
  return parseISODate(iso).getDay();
}

export function isMonday(iso: string): boolean {
  return weekday(iso) === 1;
}

// ── Semana de Vendas ─────────────────────────────────────────────────────────

/** Fim de Vendas = início + 6 dias (segunda → domingo). */
export function fimDeVendas(inicioVendasIso: string): string {
  return addDays(inicioVendasIso, 6);
}

/**
 * Ajusta uma data qualquer para a segunda-feira da sua semana (âncora de Vendas
 * sempre cai numa segunda). Útil quando o usuário informa um dia no meio da semana.
 */
export function segundaDaSemana(iso: string): string {
  const wd = weekday(iso); // 0=dom..6=sab
  const deltaParaSegunda = wd === 0 ? -6 : 1 - wd;
  return addDays(iso, deltaParaSegunda);
}

// ── Cálculo de etapas ─────────────────────────────────────────────────────────

/**
 * Calcula início/fim de cada etapa a partir da data de início de Vendas.
 * data_inicio = âncora (início/fim de Vendas) + offset.
 * data_fim = (duracao_dias-1 após o início) OU véspera do início da próxima etapa OU o próprio dia.
 */
export function computeStages(
  inicioVendasIso: string,
  stages: StageDef[] = MODELO_ETAPAS_PADRAO,
): StageComputed[] {
  const fim = fimDeVendas(inicioVendasIso);

  const comInicio = stages
    .map((s) => ({
      ...s,
      data_inicio: addDays(s.ancora === "fim_vendas" ? fim : inicioVendasIso, s.offset_dias),
    }))
    .sort((a, b) => a.ordem - b.ordem);

  const porInicio = [...comInicio].sort((a, b) => diffDays(a.data_inicio, b.data_inicio));

  return comInicio.map((s) => {
    let data_fim: string;
    if (s.duracao_dias && s.duracao_dias > 0) {
      data_fim = addDays(s.data_inicio, s.duracao_dias - 1);
    } else {
      const idx = porInicio.findIndex((x) => x.ordem === s.ordem);
      const prox = porInicio[idx + 1];
      data_fim = prox ? addDays(prox.data_inicio, -1) : s.data_inicio;
      // nunca antes do início
      if (diffDays(data_fim, s.data_inicio) < 0) data_fim = s.data_inicio;
    }
    return { ...s, data_fim };
  });
}

// ── Cálculo de datas de tarefa ─────────────────────────────────────────────────

/** Contexto de âncoras disponível para uma tarefa dentro de um projeto/etapa. */
export interface DateContext {
  inicio_vendas: string;
  fim_vendas: string;
  inicio_etapa?: string;
  fim_etapa?: string;
  /** Marcos customizados: data_cpl_1, data_live_1, data_live_downsell, fim_garantia... */
  milestones?: Record<string, string>;
}

/** Interpreta a regra de data: 'no_dia' | 'D+0' | 'D-5' | 'D+3' → offset numérico. */
export function parseRegraData(regra: string): number {
  const r = regra.trim().toLowerCase();
  if (r === "no_dia" || r === "no dia" || r === "") return 0;
  const m = r.match(/^d\s*([+-]?\d+)$/i);
  if (m) return parseInt(m[1], 10);
  const n = Number(r);
  return Number.isFinite(n) ? n : 0;
}

/** Resolve a data-âncora de uma tarefa a partir do tipo declarado. */
export function resolveAncora(tipo: string, ctx: DateContext): string | null {
  switch (tipo) {
    case "inicio_vendas":
      return ctx.inicio_vendas;
    case "fim_vendas":
      return ctx.fim_vendas;
    case "inicio_etapa":
      return ctx.inicio_etapa ?? null;
    case "fim_etapa":
      return ctx.fim_etapa ?? null;
    default:
      return ctx.milestones?.[tipo] ?? null;
  }
}

/**
 * Data final de uma tarefa = âncora resolvida + offset da regra.
 * Retorna null quando a âncora não pode ser resolvida (ex: marco ainda não definido).
 */
export function computeTaskDate(
  dataAncoraTipo: string,
  regraData: string,
  ctx: DateContext,
): string | null {
  const ancora = resolveAncora(dataAncoraTipo, ctx);
  if (!ancora) return null;
  return addDays(ancora, parseRegraData(regraData));
}

// ── Recorrência ────────────────────────────────────────────────────────────────

export interface Ocorrencia {
  data: string; // yyyy-MM-dd
  indice: number; // 0-based
}

/**
 * Expande uma tarefa recorrente em instâncias dentro de uma janela [inicio, fim].
 * Tarefas não recorrentes ('nao') retornam uma única instância na data-base.
 */
export function expandRecorrencia(
  recorrencia: Recorrencia,
  dataBase: string,
  janela: { inicio: string; fim: string },
): Ocorrencia[] {
  if (recorrencia === "nao") return [{ data: dataBase, indice: 0 }];

  const inicio = diffDays(dataBase, janela.inicio) >= 0 ? dataBase : janela.inicio;
  const stepPorTipo: Record<Exclude<Recorrencia, "nao">, number> = {
    diario: 1,
    diario_2x: 1,
    a_cada_3_dias: 3,
    a_cada_7_dias: 7,
    semanal: 7,
    rotineiro: 1,
  };
  const porDia = recorrencia === "diario_2x" ? 2 : 1;
  const step = stepPorTipo[recorrencia];

  const ocorrencias: Ocorrencia[] = [];
  let cursor = inicio;
  let indice = 0;
  // guarda de segurança contra janelas inválidas
  let guard = 0;
  while (diffDays(janela.fim, cursor) >= 0 && guard < 1000) {
    for (let k = 0; k < porDia; k++) ocorrencias.push({ data: cursor, indice: indice++ });
    cursor = addDays(cursor, step);
    guard++;
  }
  return ocorrencias.length ? ocorrencias : [{ data: dataBase, indice: 0 }];
}
