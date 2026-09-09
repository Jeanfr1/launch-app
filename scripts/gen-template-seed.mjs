#!/usr/bin/env node
// Gera src/lib/template-seed.ts a partir de data/tasks_lancamento_seed.csv.
// Normaliza os dados reais (sujos) para os enums/formatos do app.
// Uso: node scripts/gen-template-seed.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const csv = readFileSync(join(process.cwd(), "data", "tasks_lancamento_seed.csv"), "utf8");

// --- parser CSV simples com suporte a aspas ---
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const raw = parseCSV(csv).filter((r) => r.some((c) => c.trim() !== ""));
const header = raw[0];
const idx = (name) => header.indexOf(name);
const col = {
  etapa: idx("Etapa"), sub: idx("Subetapa"), tarefa: idx("Tarefa"),
  desc: idx("Descricao_operacional"), canal: idx("Canal"), resp: idx("Responsavel"),
  aprov: idx("Aprovador"), dep: idx("Dependencia"), ancora: idx("Data_ancora"),
  regra: idx("Regra_de_data"), rec: idx("Recorrencia"), prio: idx("Prioridade"),
  auto: idx("Automacao"), ferr: idx("Ferramenta"), obs: idx("Observacoes"),
};
const rows = raw.slice(1).map((r) => Object.fromEntries(Object.entries(col).map(([k, i]) => [k, (r[i] ?? "").trim()])));

const noAccent = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function mapAncora(s) {
  const n = noAccent(s);
  if (n.includes("fim") && n.includes("garantia")) return "fim_garantia";
  if (n.includes("data live downsell")) return "data_live_downsell";
  if (n.startsWith("fim da etapa") || n === "fim etapa") return "fim_etapa";
  if (n.includes("fim vendas")) return "fim_vendas";
  if (n.includes("inicio vendas")) return "inicio_vendas";
  // "inicio da etapa", "inicio downsell/reabertura/onboarding" => início da própria etapa
  if (n.startsWith("inicio")) return "inicio_etapa";
  return "inicio_etapa";
}

function mapRegra(s) {
  const m = s.match(/d\s*([+-]?\d+)/i);
  if (!m) return "no_dia";
  const num = parseInt(m[1], 10);
  return `D${num >= 0 ? "+" : "-"}${Math.abs(num)}`;
}

function mapRecorrencia(s) {
  const n = noAccent(s);
  if (n.startsWith("diario 2") || n.includes("2x")) return "diario_2x";
  if (n.startsWith("diario")) return "diario";
  if (n.includes("a cada 3")) return "a_cada_3_dias";
  if (n.includes("a cada 7")) return "a_cada_7_dias";
  if (n.includes("semanal")) return "semanal";
  if (n.includes("rotineiro") || n.includes("recorrente")) return "rotineiro";
  return "nao"; // inclui "não", vazio e valores inválidos ("Alta")
}

function mapPrioridade(s) {
  const n = noAccent(s);
  if (n.includes("urgent")) return "urgente";
  if (n.startsWith("alta")) return "alta";
  if (n.startsWith("baixa")) return "baixa";
  if (n.startsWith("media")) return "media";
  return "media";
}

function mapPapel(s) {
  const n = noAccent(s);
  if (!n || n === "-") return null;
  if (n.includes("copy")) return "copywriter";
  if (n.includes("automacao") || n.includes("automa")) return "automacao";
  if (n.includes("trafego")) return "gestor_trafego";
  if (n.includes("social")) return "social_media";
  if (n.includes("editor") || n.includes("video")) return "editor_video";
  if (n.includes("suporte")) return "suporte_alunos";
  if (n.includes("comercial")) return "comercial";
  if (n.includes("estrateg")) return "estrategista_senior";
  if (n.includes("projeto")) return "gestor_projetos";
  if (n.includes("especialista")) return "especialista";
  return null;
}

// Modelo canônico de 10 etapas (seção 5) — ordem/âncora/offset.
const STAGES = [
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
const stageByName = new Map(STAGES.map((s) => [noAccent(s.nome), { ...s, tasks: [] }]));

let ordemTask = 0;
let semEtapa = 0;
for (const r of rows) {
  const st = stageByName.get(noAccent(r.etapa));
  if (!st) { semEtapa++; continue; }
  st.tasks.push({
    ordem: ordemTask++,
    subetapa: r.sub || null,
    titulo: r.tarefa || "(sem título)",
    descricao_operacional: r.desc || null,
    canal: r.canal && r.canal !== "-" ? r.canal : null,
    responsavel_papel: mapPapel(r.resp),
    aprovador_papel: mapPapel(r.aprov),
    dependencia_texto: r.dep && r.dep !== "-" ? r.dep : null,
    data_ancora_tipo: mapAncora(r.ancora),
    regra_data: mapRegra(r.regra),
    recorrencia: mapRecorrencia(r.rec),
    prioridade: mapPrioridade(r.prio),
    automacao: noAccent(r.auto) === "sim",
    ferramenta: r.ferr && r.ferr !== "-" ? r.ferr : null,
    observacoes: r.obs || null,
  });
}

const total = [...stageByName.values()].reduce((a, s) => a + s.tasks.length, 0);
const out = `// GERADO por scripts/gen-template-seed.mjs — não editar à mão.
// Template "Lançamento padrão" derivado de data/tasks_lancamento_seed.csv (${total} tarefas).

export interface SeedTask {
  ordem: number;
  subetapa: string | null;
  titulo: string;
  descricao_operacional: string | null;
  canal: string | null;
  responsavel_papel: string | null;
  aprovador_papel: string | null;
  dependencia_texto: string | null;
  data_ancora_tipo: string;
  regra_data: string;
  recorrencia: "nao" | "diario" | "diario_2x" | "a_cada_3_dias" | "a_cada_7_dias" | "semanal" | "rotineiro";
  prioridade: "baixa" | "media" | "alta" | "urgente";
  automacao: boolean;
  ferramenta: string | null;
  observacoes: string | null;
}

export interface SeedStage {
  nome: string;
  ordem: number;
  ancora: "inicio_vendas" | "fim_vendas";
  offset_dias: number;
  duracao_dias?: number;
  tasks: SeedTask[];
}

export const TEMPLATE_PADRAO: {
  nome: string;
  descricao: string;
  totalTarefas: number;
  stages: SeedStage[];
} = ${JSON.stringify(
  {
    nome: "Lançamento padrão",
    descricao: "Cronograma completo de lançamento (CPL → aquecimento → carrinho → downsell).",
    totalTarefas: total,
    stages: [...stageByName.values()],
  },
  null,
  2,
)};
`;

writeFileSync(join(process.cwd(), "src", "lib", "template-seed.ts"), out);
console.log(`✓ template-seed.ts gerado — ${total} tarefas, ${STAGES.length} etapas, ${semEtapa} linhas sem etapa correspondente`);
