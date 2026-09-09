import Link from "next/link";
import { RocketIcon, CalendarRangeIcon, CheckCircle2Icon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS_PROJETO_LABEL, formatarData } from "@/lib/constants";
import { NovoProjetoDialog } from "@/components/app/novo-projeto-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_BADGE: Record<string, string> = {
  planejamento: "bg-slate-500/15 text-slate-400 border-transparent",
  em_andamento: "bg-indigo-500/15 text-indigo-400 border-transparent",
  concluido: "bg-emerald-500/15 text-emerald-400 border-transparent",
  arquivado: "bg-muted text-muted-foreground border-transparent",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: projetos } = await supabase
    .from("projects")
    .select("id, nome, status, data_inicio_vendas, data_fim_vendas")
    .order("created_at", { ascending: false });

  const lista = projetos ?? [];
  const ids = lista.map((p) => p.id);

  // Agrega contagem de tarefas por projeto (total e concluídas) numa consulta.
  const contagem = new Map<string, { total: number; concluidas: number }>();
  if (ids.length > 0) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("project_id, status")
      .in("project_id", ids);
    for (const t of tasks ?? []) {
      const c = contagem.get(t.project_id) ?? { total: 0, concluidas: 0 };
      c.total += 1;
      if (t.status === "concluido") c.concluidas += 1;
      contagem.set(t.project_id, c);
    }
  }

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Seus lançamentos em andamento</p>
        </div>
        <NovoProjetoDialog />
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {lista.length === 0 ? (
          <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-5 rounded-2xl border border-dashed p-12 text-center">
            <div className="brand-gradient flex size-14 items-center justify-center rounded-2xl shadow-lg shadow-primary/25">
              <RocketIcon className="size-7 text-white" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">Nenhum lançamento ainda</p>
              <p className="text-sm text-muted-foreground">
                Crie seu primeiro lançamento — as 10 etapas e todas as datas são geradas
                automaticamente pelo motor de datas.
              </p>
            </div>
            <NovoProjetoDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {lista.map((p) => {
              const c = contagem.get(p.id) ?? { total: 0, concluidas: 0 };
              const pct = c.total > 0 ? Math.round((c.concluidas / c.total) * 100) : 0;
              return (
                <Link key={p.id} href={`/projetos/${p.id}`} className="group">
                  <Card className="h-full gap-0 p-5 transition-all group-hover:border-primary/40 group-hover:shadow-md group-hover:shadow-primary/5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="line-clamp-2 font-semibold leading-snug">{p.nome}</h2>
                      <Badge className={STATUS_BADGE[p.status] ?? ""}>
                        {STATUS_PROJETO_LABEL[p.status] ?? p.status}
                      </Badge>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2Icon className="size-3.5" />
                          {c.concluidas}/{c.total} tarefas
                        </span>
                        <span className="font-medium tabular-nums">{pct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="brand-gradient h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarRangeIcon className="size-3.5" />
                      Vendas {formatarData(p.data_inicio_vendas)} – {formatarData(p.data_fim_vendas)}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
