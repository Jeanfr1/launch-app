import { beforeEach, describe, expect, it, vi } from "vitest";
import { adicionarPessoa, removerPessoa } from "./team";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/auth", () => ({ requireUser: async () => ({ supabase: { rpc: mocks.rpc } }) }));
const projectId = "123e4567-e89b-42d3-a456-426614174000";
const userId = "123e4567-e89b-42d3-a456-426614174001";

beforeEach(() => vi.clearAllMocks());
describe("equipe", () => {
  it("normaliza o e-mail e informa quando o acesso fica pendente", async () => {
    mocks.rpc.mockResolvedValue({ data: "pendente", error: null });
    expect(await adicionarPessoa({ projectId, email: " Pessoa@Empresa.com ", papel: "copywriter" })).toEqual({ ok: true, pendente: true });
    expect(mocks.rpc).toHaveBeenCalledWith("add_project_person", { p_project: projectId, p_email: "pessoa@empresa.com", p_role: "copywriter" });
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/projetos/${projectId}`);
  });
  it("informa quando uma conta existente recebe acesso imediato", async () => {
    mocks.rpc.mockResolvedValue({ data: "adicionado", error: null });
    expect(await adicionarPessoa({ projectId, email: "pessoa@empresa.com", papel: "especialista" })).toEqual({ ok: true, pendente: false });
  });
  it.each(["owner", "cliente", "admin"])("recusa função %s antes de chamar o banco", async (papel) => {
    expect((await adicionarPessoa({ projectId, email: "pessoa@empresa.com", papel })).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("recusa e-mail inválido", async () => {
    expect((await adicionarPessoa({ projectId, email: "inválido", papel: "copywriter" })).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("propaga a recusa de permissão do banco sem revalidar", async () => {
    mocks.rpc.mockResolvedValue({ error: { code: "P0001", message: "Você não tem permissão para gerenciar esta equipe." } });
    const result = await adicionarPessoa({ projectId, email: "pessoa@empresa.com", papel: "copywriter" });
    expect(result).toEqual({ ok: false, erro: "Você não tem permissão para gerenciar esta equipe." });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
  it("recusa remoção ambígua e não chama o banco", async () => {
    expect((await removerPessoa({ projectId, userId, conviteId: userId })).ok).toBe(false);
    expect((await removerPessoa({ projectId })).ok).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("escopa o cancelamento ao projeto", async () => {
    mocks.rpc.mockResolvedValue({ error: null });
    expect(await removerPessoa({ projectId, conviteId: userId })).toEqual({ ok: true });
    expect(mocks.rpc).toHaveBeenCalledWith("remove_project_person", { p_project: projectId, p_invitation: userId, p_user: undefined });
  });
  it("não comunica sucesso quando o proprietário é protegido pelo banco", async () => {
    mocks.rpc.mockResolvedValue({ error: { code: "P0001", message: "Não é possível remover o proprietário ou seu próprio acesso." } });
    expect((await removerPessoa({ projectId, userId })).ok).toBe(false);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
