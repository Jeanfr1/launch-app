import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EquipeDialog } from "./equipe-dialog";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/team", () => ({ adicionarPessoa: vi.fn(), removerPessoa: vi.fn() }));
const membros = [
  { user_id: "owner", papel: "owner" as const, full_name: "Ana", avatar_url: null },
  { user_id: "member", papel: "copywriter" as const, full_name: "Bruno", avatar_url: null },
];
afterEach(cleanup);

describe("diálogo da equipe", () => {
  it("mostra a equipe para membros comuns sem controles de administração", async () => {
    const user = userEvent.setup();
    render(<EquipeDialog projectId="project" userId="member" membros={membros} convites={[]} podeGerenciar={false} erroCarregamento={false} />);
    await user.click(screen.getByRole("button", { name: /Equipe/ }));
    expect(screen.getByText("Bruno (você)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Adicionar pessoa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remover/ })).not.toBeInTheDocument();
  });
  it("protege o proprietário e pede confirmação antes de remover outro membro", async () => {
    const user = userEvent.setup();
    render(<EquipeDialog projectId="project" userId="owner" membros={membros} convites={[]} podeGerenciar erroCarregamento={false} />);
    await user.click(screen.getByRole("button", { name: /Equipe/ }));
    expect(screen.queryByRole("button", { name: "Remover Ana" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover Bruno" }));
    expect(screen.getByRole("button", { name: "Confirmar remoção" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("button", { name: "Confirmar remoção" })).not.toBeInTheDocument();
  });
});
