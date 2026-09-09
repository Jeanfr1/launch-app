"use client";

import { useMemo, useState } from "react";
import { LayoutGridIcon, ListIcon, CalendarRangeIcon } from "lucide-react";
import type { TarefaBoard, EtapaBoard, MembroBoard } from "@/lib/types";
import { formatarData } from "@/lib/constants";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { KanbanBoard } from "@/components/board/kanban-board";
import { ListaTarefas } from "@/components/board/lista-tarefas";
import { NovaTarefaDialog } from "@/components/board/nova-tarefa-dialog";

export function ProjetoTabs({
  projectId,
  tarefasIniciais,
  etapas,
  membros,
}: {
  projectId: string;
  tarefasIniciais: TarefaBoard[];
  etapas: EtapaBoard[];
  membros: MembroBoard[];
}) {
  const [tarefas, setTarefas] = useState<TarefaBoard[]>(tarefasIniciais);

  // Reconcilia com o servidor quando os dados realmente mudam (ex.: após router.refresh()).
  // Padrão oficial do React: ajustar estado durante o render comparando uma assinatura.
  const sig = useMemo(
    () =>
      JSON.stringify(
        tarefasIniciais.map((t) => [
          t.id,
          t.status,
          t.ordem_kanban,
          t.prioridade,
          t.visivel_cliente,
          t.data_calculada,
          t.titulo,
        ]),
      ),
    [tarefasIniciais],
  );
  const [sigAnterior, setSigAnterior] = useState(sig);
  if (sig !== sigAnterior) {
    setSigAnterior(sig);
    setTarefas(tarefasIniciais);
  }

  const membrosMap = useMemo(() => new Map(membros.map((m) => [m.user_id, m])), [membros]);

  return (
    <Tabs defaultValue="kanban" className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-6 py-3">
        <TabsList>
          <TabsTrigger value="kanban">
            <LayoutGridIcon className="size-4" /> Quadro
          </TabsTrigger>
          <TabsTrigger value="lista">
            <ListIcon className="size-4" /> Lista
          </TabsTrigger>
          <TabsTrigger value="cronograma">
            <CalendarRangeIcon className="size-4" /> Cronograma
          </TabsTrigger>
        </TabsList>
        <NovaTarefaDialog projectId={projectId} etapas={etapas} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
        <TabsContent value="kanban">
          <KanbanBoard
            projectId={projectId}
            tarefas={tarefas}
            setTarefas={setTarefas}
            membros={membrosMap}
          />
        </TabsContent>

        <TabsContent value="lista">
          <ListaTarefas
            projectId={projectId}
            tarefas={tarefas}
            setTarefas={setTarefas}
            etapas={etapas}
            membros={membrosMap}
          />
        </TabsContent>

        <TabsContent value="cronograma">
          <ol className="relative ml-2 border-l pl-6">
            {etapas.map((e) => {
              const ehVendas = e.nome === "Vendas";
              const qtd = tarefas.filter((t) => t.stage_id === e.id).length;
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
                    <span className="text-xs text-muted-foreground">{qtd} tarefa(s)</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatarData(e.data_inicio)} → {formatarData(e.data_fim)}
                  </p>
                </li>
              );
            })}
          </ol>
        </TabsContent>
      </div>
    </Tabs>
  );
}
