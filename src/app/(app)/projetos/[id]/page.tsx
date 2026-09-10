import { EquipeDialog } from "@/components/board/equipe-dialog";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { STATUS_PROJETO_LABEL, formatarData } from "@/lib/constants";
import type { MembroBoard } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ProjetoTabs } from "@/components/board/projeto-tabs";

export default async function ProjetoPage({ params }: PageProps<"/projetos/[id]">) {
  const { id } = await params;
  const { user, supabase } = await requireUser();

  const { data: projeto } = await supabase
    .from("projects")
    .select("id, nome, status, data_inicio_vendas, data_fim_vendas")
    .eq("id", id)
    .single();

  if (!projeto) notFound();

  const [{ data: etapas }, { data: tarefas }, { data: membrosRaw, error: erroMembros }] = await Promise.all([
    supabase
      .from("stages")
      .select("id, nome, ordem, data_inicio, data_fim")
      .eq("project_id", id)
      .order("ordem", { ascending: true }),
    supabase
      .from("tasks")
      .select(
        "id, titulo, subetapa, canal, status, prioridade, stage_id, responsavel_id, data_calculada, visivel_cliente, ordem_kanban, story_points",
      )
      .eq("project_id", id)
      .order("ordem_kanban", { ascending: true }),
    supabase
      .from("project_members")
      .select("user_id, papel, profiles(full_name, avatar_url)")
      .eq("project_id", id),
  ]);

  const membros: MembroBoard[] = (membrosRaw ?? []).map((m) => ({
    user_id: m.user_id,
    papel: m.papel,
    full_name: m.profiles?.full_name ?? null,
    avatar_url: m.profiles?.avatar_url ?? null,
  }));

  const papelAtual = membros.find((m) => m.user_id === user.id)?.papel;
  const podeGerenciar = papelAtual === "owner" || papelAtual === "gestor_projetos";
  const { data: convites, error: erroConvites } = podeGerenciar
    ? await supabase.from("project_invitations").select("id, email, papel").eq("project_id", id).order("created_at")
    : { data: [], error: null };

  return (
    <>
      <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b px-6 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="break-words text-lg font-semibold">{projeto.nome}</h1>
          <Badge variant="secondary">
            {STATUS_PROJETO_LABEL[projeto.status] ?? projeto.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
        <EquipeDialog projectId={id} userId={user.id} membros={membros} convites={convites ?? []} podeGerenciar={podeGerenciar} erroCarregamento={Boolean(erroMembros || erroConvites)} />
        <span className="hidden text-sm text-muted-foreground sm:block">
          Vendas: {formatarData(projeto.data_inicio_vendas)} —{" "}
          {formatarData(projeto.data_fim_vendas)}
        </span>
        </div>
      </header>

      <ProjetoTabs
        projectId={projeto.id}
        tarefasIniciais={tarefas ?? []}
        etapas={etapas ?? []}
        membros={membros}
      />
    </>
  );
}
