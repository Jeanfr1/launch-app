import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  arquivado: "Arquivado",
};

function formatarData(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default async function ProjetoPage({
  params,
}: PageProps<"/projetos/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: projeto } = await supabase
    .from("projects")
    .select("id, nome, status, data_inicio_vendas, data_fim_vendas")
    .eq("id", id)
    .single();

  if (!projeto) notFound();

  const { data: etapas } = await supabase
    .from("stages")
    .select("id, nome, ordem, data_inicio, data_fim")
    .eq("project_id", id)
    .order("ordem", { ascending: true });

  const lista = etapas ?? [];

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{projeto.nome}</h1>
          <Badge variant="secondary">
            {STATUS_LABEL[projeto.status] ?? projeto.status}
          </Badge>
        </div>
        <span className="text-sm text-muted-foreground">
          Vendas: {formatarData(projeto.data_inicio_vendas)} —{" "}
          {formatarData(projeto.data_fim_vendas)}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase text-muted-foreground">
          Cronograma de etapas
        </h2>
        <ol className="relative border-l pl-6">
          {lista.map((e) => {
            const ehVendas = e.nome === "Vendas";
            return (
              <li key={e.id} className="mb-6 last:mb-0">
                <span
                  className={`absolute -left-[7px] mt-1.5 size-3 rounded-full ${
                    ehVendas ? "bg-primary" : "bg-muted-foreground/40"
                  }`}
                />
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-medium">
                    {e.ordem}. {e.nome}
                  </span>
                  {ehVendas && <Badge>Semana âncora</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatarData(e.data_inicio)} → {formatarData(e.data_fim)}
                </p>
              </li>
            );
          })}
        </ol>
      </main>
    </>
  );
}
