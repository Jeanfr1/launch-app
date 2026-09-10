"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TarefaBoard, MembroBoard, StatusTarefa } from "@/lib/types";
import { STATUS_ORDEM, STATUS_LABEL, STATUS_COR } from "@/lib/constants";
import { moverTarefa } from "@/lib/actions/tasks";
import { TaskCard } from "@/components/board/task-card";
import { cn } from "@/lib/utils";

function CartaoSortable({
  tarefa,
  membros,
  onAbrir,
}: {
  tarefa: TarefaBoard;
  membros: Map<string, MembroBoard>;
  onAbrir: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tarefa.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("touch-none", isDragging && "opacity-40")}
      onClick={() => onAbrir(tarefa.id)}
      {...attributes}
      {...listeners}
    >
      <TaskCard tarefa={tarefa} membros={membros} />
    </div>
  );
}

function Coluna({
  status,
  tarefas,
  membros,
  onAbrir,
}: {
  status: StatusTarefa;
  tarefas: TarefaBoard[];
  membros: Map<string, MembroBoard>;
  onAbrir: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1.5">
        <span className={cn("size-2 rounded-full", STATUS_COR[status])} />
        <span className="text-sm font-semibold">{STATUS_LABEL[status]}</span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {tarefas.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors",
          isOver
            ? "border-primary/50 bg-accent/50 ring-2 ring-primary/20"
            : "border-border/60 bg-muted/30",
        )}
      >
        <SortableContext items={tarefas.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tarefas.map((t) => (
            <CartaoSortable key={t.id} tarefa={t} membros={membros} onAbrir={onAbrir} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function ordemEntre(prev?: number, next?: number): number {
  if (prev == null && next == null) return 0;
  if (prev == null) return next! - 1;
  if (next == null) return prev + 1;
  return (prev + next) / 2;
}

export function KanbanBoard({
  projectId,
  tarefas,
  setTarefas,
  membros,
  onAbrir,
}: {
  projectId: string;
  tarefas: TarefaBoard[];
  setTarefas: (updater: (prev: TarefaBoard[]) => TarefaBoard[]) => void;
  membros: Map<string, MembroBoard>;
  onAbrir: (id: string) => void;
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const colunas = useMemo(() => {
    const map: Record<StatusTarefa, TarefaBoard[]> = {
      backlog: [],
      a_fazer: [],
      em_andamento: [],
      em_revisao: [],
      aguardando_aprovacao: [],
      concluido: [],
      bloqueado: [],
    };
    for (const t of tarefas) map[t.status].push(t);
    for (const s of STATUS_ORDEM)
      map[s].sort((a, b) => a.ordem_kanban - b.ordem_kanban);
    return map;
  }, [tarefas]);

  const ativa = activeId ? tarefas.find((t) => t.id === activeId) : null;

  function statusDe(id: string): StatusTarefa | null {
    if ((STATUS_ORDEM as string[]).includes(id)) return id as StatusTarefa;
    return tarefas.find((t) => t.id === id)?.status ?? null;
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeTaskId = String(active.id);
    const destino = statusDe(String(over.id));
    const arrastada = tarefas.find((t) => t.id === activeTaskId);
    if (!destino || !arrastada) return;

    // Lista da coluna destino sem a tarefa arrastada.
    const destinoLista = colunas[destino].filter((t) => t.id !== activeTaskId);
    let index = destinoLista.length;
    if (!(STATUS_ORDEM as string[]).includes(String(over.id))) {
      const i = destinoLista.findIndex((t) => t.id === String(over.id));
      if (i >= 0) index = i;
    }
    const prev = destinoLista[index - 1]?.ordem_kanban;
    const next = destinoLista[index]?.ordem_kanban;
    const novaOrdem = ordemEntre(prev, next);

    if (arrastada.status === destino && arrastada.ordem_kanban === novaOrdem) return;

    // Otimista.
    setTarefas((prevT) =>
      prevT.map((t) =>
        t.id === activeTaskId ? { ...t, status: destino, ordem_kanban: novaOrdem } : t,
      ),
    );

    const res = await moverTarefa({
      taskId: activeTaskId,
      project_id: projectId,
      status: destino,
      ordem_kanban: novaOrdem,
    });
    if (!res.ok) {
      toast.error("Não foi possível mover", { description: res.erro });
      router.refresh();
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STATUS_ORDEM.map((s) => (
          <Coluna key={s} status={s} tarefas={colunas[s]} membros={membros} onAbrir={onAbrir} />
        ))}
      </div>
      <DragOverlay>
        {ativa ? <TaskCard tarefa={ativa} membros={membros} arrastando /> : null}
      </DragOverlay>
    </DndContext>
  );
}
