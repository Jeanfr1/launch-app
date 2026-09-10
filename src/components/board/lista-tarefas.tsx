"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import type { TarefaBoard, MembroBoard, EtapaBoard, StatusTarefa, Prioridade } from "@/lib/types";
import {
  STATUS_ORDEM,
  STATUS_LABEL,
  PRIORIDADE_ORDEM,
  PRIORIDADE_LABEL,
  formatarData,
} from "@/lib/constants";
import { atualizarTarefa, excluirTarefa } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const selectCls =
  "h-7 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function ListaTarefas({
  projectId,
  tarefas,
  setTarefas,
  etapas,
  membros,
  onAbrir,
}: {
  projectId: string;
  tarefas: TarefaBoard[];
  setTarefas: (updater: (prev: TarefaBoard[]) => TarefaBoard[]) => void;
  etapas: EtapaBoard[];
  membros: Map<string, MembroBoard>;
  onAbrir: (id: string) => void;
}) {
  const router = useRouter();
  const etapaNome = new Map(etapas.map((e) => [e.id, e.nome]));

  async function patch(id: string, patch: Partial<TarefaBoard>) {
    setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const res = await atualizarTarefa({ taskId: id, project_id: projectId, patch });
    if (!res.ok) {
      toast.error("Não foi possível atualizar", { description: res.erro });
      router.refresh();
    }
  }

  async function remover(id: string) {
    const anterior = tarefas;
    setTarefas((prev) => prev.filter((t) => t.id !== id));
    const res = await excluirTarefa({ taskId: id, project_id: projectId });
    if (!res.ok) {
      toast.error("Não foi possível excluir", { description: res.erro });
      setTarefas(() => anterior);
    } else {
      toast.success("Tarefa excluída");
    }
  }

  const ordenadas = [...tarefas].sort((a, b) => {
    const ea = etapas.find((e) => e.id === a.stage_id)?.ordem ?? 999;
    const eb = etapas.find((e) => e.id === b.stage_id)?.ordem ?? 999;
    return ea - eb || a.ordem_kanban - b.ordem_kanban;
  });

  if (tarefas.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhuma tarefa ainda. Crie a primeira no botão “Nova tarefa”.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Tarefa</th>
            <th className="px-3 py-2 font-medium">Etapa</th>
            <th className="px-3 py-2 font-medium">Responsável</th>
            <th className="px-3 py-2 font-medium">Prioridade</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Data</th>
            <th className="px-3 py-2 text-center font-medium">Cliente</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((t) => {
            const resp = t.responsavel_id ? membros.get(t.responsavel_id) : undefined;
            return (
              <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onAbrir(t.id)}
                    className="text-left font-medium hover:text-primary hover:underline"
                  >
                    {t.titulo}
                  </button>
                  {(t.subetapa || t.canal) && (
                    <p className="text-xs text-muted-foreground">
                      {[t.subetapa, t.canal].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {t.stage_id ? etapaNome.get(t.stage_id) ?? "—" : "—"}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {resp?.full_name ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <select
                    className={selectCls}
                    value={t.prioridade}
                    onChange={(e) => patch(t.id, { prioridade: e.target.value as Prioridade })}
                    aria-label="Prioridade"
                  >
                    {PRIORIDADE_ORDEM.map((p) => (
                      <option key={p} value={p}>
                        {PRIORIDADE_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    className={cn(selectCls, "max-w-[150px]")}
                    value={t.status}
                    onChange={(e) => patch(t.id, { status: e.target.value as StatusTarefa })}
                    aria-label="Status"
                  >
                    {STATUS_ORDEM.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {formatarData(t.data_calculada)}
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    className="size-4 accent-emerald-500"
                    checked={t.visivel_cliente}
                    onChange={(e) => patch(t.id, { visivel_cliente: e.target.checked })}
                    aria-label="Visível ao cliente"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Excluir tarefa"
                    onClick={() => remover(t.id)}
                  >
                    <Trash2Icon className="size-3.5 text-muted-foreground" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
