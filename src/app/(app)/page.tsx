import Link from "next/link";
import { RocketIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NovoProjetoDialog } from "@/components/app/novo-projeto-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: projetos } = await supabase
    .from("projects")
    .select("id, nome, status, data_inicio_vendas, data_fim_vendas")
    .order("created_at", { ascending: false });

  const lista = projetos ?? [];

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b px-6">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <NovoProjetoDialog />
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {lista.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-full bg-muted p-4">
              <RocketIcon className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium">Nenhum lançamento ainda</p>
              <p className="text-sm text-muted-foreground">
                Crie seu primeiro lançamento — as 10 etapas e as datas são geradas
                automaticamente.
              </p>
            </div>
            <NovoProjetoDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((p) => (
              <Link key={p.id} href={`/projetos/${p.id}`}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{p.nome}</CardTitle>
                      <Badge variant="secondary">
                        {STATUS_LABEL[p.status] ?? p.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Vendas: {formatarData(p.data_inicio_vendas)} —{" "}
                    {formatarData(p.data_fim_vendas)}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
