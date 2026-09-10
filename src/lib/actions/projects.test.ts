import { beforeEach, describe, expect, it, vi } from "vitest";
import { criarProjeto } from "./projects";
import { criarProjetoDoTemplate } from "./template";
import { TEMPLATE_PADRAO } from "@/lib/template-seed";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth", () => ({
  requireUser: async () => ({
    user: { id: "authenticated-user" },
    supabase: { from: mocks.from },
  }),
}));

const input = { nome: "Lançamento", data_inicio_vendas: "2026-09-16" };

describe.each([
  ["projeto em branco", criarProjeto],
  ["projeto do template", criarProjetoDoTemplate],
] as const)("%s", (_, criar) => {
  beforeEach(() => vi.clearAllMocks());

  it("cria sem exigir leitura antes do trigger de owner e reutiliza o UUID nas etapas", async () => {
    // INSERT sem SELECT retorna data:null. Solicitar RETURNING antes do
    // trigger de owner é justamente o cenário de RLS que deve ser evitado.
    const projectInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    const stageInsert = vi.fn((rows: Record<string, unknown>[]) => ({
      error: null,
      select: async () => ({
        error: null,
        data: rows.map((row, i) => ({ ...row, id: `stage-${i}` })),
      }),
    }));
    const taskInsert = vi.fn().mockResolvedValue({ error: null });
    const activityInsert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockImplementation((table: string) => {
      const inserts = {
        projects: projectInsert,
        stages: stageInsert,
        tasks: taskInsert,
        activity_log: activityInsert,
      };
      return { insert: inserts[table as keyof typeof inserts] };
    });

    const result = await criar(input);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.erro);
    expect(result.projectId).toMatch(/^[0-9a-f-]{36}$/);
    expect(projectInsert).toHaveBeenCalledWith({
      id: result.projectId,
      nome: input.nome,
      created_by: "authenticated-user",
      data_inicio_vendas: "2026-09-14",
      data_fim_vendas: "2026-09-20",
      status: "planejamento",
    });
    const stages = stageInsert.mock.calls[0][0];
    expect(stages).toHaveLength(10);
    expect(stages.every((stage) => stage.project_id === result.projectId)).toBe(true);
    if (criar === criarProjetoDoTemplate) {
      const tasks = taskInsert.mock.calls.flatMap(([rows]) => rows);
      expect(tasks).toHaveLength(TEMPLATE_PADRAO.stages.reduce((n, s) => n + s.tasks.length, 0));
      expect(tasks.every((task) => task.project_id === result.projectId)).toBe(true);
      expect(tasks.every((task) => /^stage-\d+$/.test(task.stage_id))).toBe(true);
    }
    expect(activityInsert).toHaveBeenCalledWith(expect.objectContaining({ project_id: result.projectId }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
  });

  it("interrompe a criação quando o banco recusa o projeto", async () => {
    mocks.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: "Acesso negado" } }),
    });

    expect(await criar(input)).toEqual({ ok: false, erro: "Acesso negado" });
    expect(mocks.from).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith("projects");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
