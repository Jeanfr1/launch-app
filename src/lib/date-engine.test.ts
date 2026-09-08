import { describe, it, expect } from "vitest";
import {
  addDays,
  fimDeVendas,
  segundaDaSemana,
  isMonday,
  computeStages,
  parseRegraData,
  computeTaskDate,
  resolveAncora,
  expandRecorrencia,
  MODELO_ETAPAS_PADRAO,
  type DateContext,
} from "./date-engine";

// Segunda-feira de referência: 2026-09-07 (é uma segunda).
const INICIO = "2026-09-07";

describe("utilitários de data", () => {
  it("addDays atravessa fim de mês", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("reconhece segunda-feira", () => {
    expect(isMonday(INICIO)).toBe(true);
    expect(isMonday("2026-09-08")).toBe(false);
  });
  it("segundaDaSemana normaliza qualquer dia para a segunda", () => {
    expect(segundaDaSemana("2026-09-09")).toBe(INICIO); // quarta → segunda
    expect(segundaDaSemana("2026-09-13")).toBe(INICIO); // domingo → segunda da mesma semana
    expect(segundaDaSemana(INICIO)).toBe(INICIO);
  });
});

describe("semana de Vendas", () => {
  it("fim de vendas é o domingo (início + 6)", () => {
    expect(fimDeVendas(INICIO)).toBe("2026-09-13");
    expect(isMonday(INICIO)).toBe(true);
  });
});

describe("computeStages — modelo padrão de 10 etapas", () => {
  const stages = computeStages(INICIO);

  it("produz as 10 etapas", () => {
    expect(stages).toHaveLength(10);
  });

  it("posiciona cada etapa conforme a seção 5", () => {
    const byName = Object.fromEntries(stages.map((s) => [s.nome, s]));
    expect(byName["Onboarding / Concepção"].data_inicio).toBe(addDays(INICIO, -49));
    expect(byName["Captação de Leads"].data_inicio).toBe(addDays(INICIO, -28));
    expect(byName["Aquecimento"].data_inicio).toBe(addDays(INICIO, -21));
    expect(byName["Evento"].data_inicio).toBe(addDays(INICIO, -7));
    expect(byName["Vendas"].data_inicio).toBe(INICIO);
    expect(byName["Vendas"].data_fim).toBe("2026-09-13"); // 7 dias
    expect(byName["Reabertura"].data_inicio).toBe(addDays("2026-09-13", 1));
    expect(byName["Debriefing"].data_inicio).toBe(addDays("2026-09-13", 5));
    expect(byName["Downsell"].data_inicio).toBe(addDays("2026-09-13", 10));
  });

  it("mantém a integridade do modelo de referência", () => {
    expect(MODELO_ETAPAS_PADRAO).toHaveLength(10);
  });
});

describe("parseRegraData", () => {
  it.each([
    ["no_dia", 0],
    ["D+0", 0],
    ["D-5", -5],
    ["D+3", 3],
    ["D-21", -21],
    ["", 0],
    ["lixo", 0],
  ])("interpreta %s como %i", (regra, esperado) => {
    expect(parseRegraData(regra)).toBe(esperado);
  });
});

describe("computeTaskDate", () => {
  const ctx: DateContext = {
    inicio_vendas: INICIO,
    fim_vendas: fimDeVendas(INICIO),
    inicio_etapa: "2026-08-17",
    fim_etapa: "2026-08-31",
    milestones: { data_cpl_1: "2026-08-20", data_live_1: "2026-08-25" },
  };

  it("âncora início de Vendas com D-5", () => {
    expect(computeTaskDate("inicio_vendas", "D-5", ctx)).toBe(addDays(INICIO, -5));
  });
  it("âncora fim de Vendas com D+10 (downsell)", () => {
    expect(computeTaskDate("fim_vendas", "D+10", ctx)).toBe(addDays(ctx.fim_vendas, 10));
  });
  it("âncora início da etapa 'no_dia'", () => {
    expect(computeTaskDate("inicio_etapa", "no_dia", ctx)).toBe("2026-08-17");
  });
  it("âncora por marco customizado (data_cpl_1) com D+1", () => {
    expect(computeTaskDate("data_cpl_1", "D+1", ctx)).toBe("2026-08-21");
  });
  it("retorna null quando o marco não existe", () => {
    expect(computeTaskDate("data_inexistente", "D+0", ctx)).toBeNull();
    expect(resolveAncora("inicio_etapa", { inicio_vendas: INICIO, fim_vendas: ctx.fim_vendas })).toBeNull();
  });
});

describe("expandRecorrencia", () => {
  const janela = { inicio: "2026-09-01", fim: "2026-09-07" }; // 7 dias

  it("'nao' gera uma única instância", () => {
    expect(expandRecorrencia("nao", "2026-09-03", janela)).toEqual([
      { data: "2026-09-03", indice: 0 },
    ]);
  });
  it("'diario' cobre a janela toda a partir da data-base", () => {
    const oc = expandRecorrencia("diario", "2026-09-01", janela);
    expect(oc).toHaveLength(7);
    expect(oc[0].data).toBe("2026-09-01");
    expect(oc[6].data).toBe("2026-09-07");
  });
  it("'diario_2x' gera 2 instâncias por dia", () => {
    const oc = expandRecorrencia("diario_2x", "2026-09-01", janela);
    expect(oc).toHaveLength(14);
    expect(oc[0].data).toBe("2026-09-01");
    expect(oc[1].data).toBe("2026-09-01");
  });
  it("'a_cada_3_dias' respeita o passo", () => {
    const oc = expandRecorrencia("a_cada_3_dias", "2026-09-01", janela);
    expect(oc.map((o) => o.data)).toEqual(["2026-09-01", "2026-09-04", "2026-09-07"]);
  });
  it("'semanal' gera pontos a cada 7 dias", () => {
    const oc = expandRecorrencia("semanal", "2026-09-01", { inicio: "2026-09-01", fim: "2026-09-30" });
    expect(oc.map((o) => o.data)).toEqual(["2026-09-01", "2026-09-08", "2026-09-15", "2026-09-22", "2026-09-29"]);
  });
});
