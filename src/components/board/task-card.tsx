"use client";

import { EyeIcon, CalendarIcon } from "lucide-react";
import type { TarefaBoard, MembroBoard } from "@/lib/types";
import {
  PRIORIDADE_COR,
  PRIORIDADE_BADGE,
  PRIORIDADE_LABEL,
  formatarData,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function iniciais(nome?: string | null) {
  if (!nome) return "?";
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function TaskCard({
  tarefa,
  membros,
  arrastando,
}: {
  tarefa: TarefaBoard;
  membros: Map<string, MembroBoard>;
  arrastando?: boolean;
}) {
  const responsavel = tarefa.responsavel_id ? membros.get(tarefa.responsavel_id) : undefined;
  return (
    <div
      className={cn(
        "cursor-grab rounded-lg border border-l-[3px] bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        PRIORIDADE_COR[tarefa.prioridade],
        arrastando && "rotate-1 opacity-90 shadow-lg ring-2 ring-primary/40",
      )}
    >
      <p className="text-sm font-medium leading-snug">{tarefa.titulo}</p>
      {(tarefa.subetapa || tarefa.canal) && (
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {[tarefa.subetapa, tarefa.canal].filter(Boolean).join(" · ")}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            PRIORIDADE_BADGE[tarefa.prioridade],
          )}
        >
          {PRIORIDADE_LABEL[tarefa.prioridade]}
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {tarefa.visivel_cliente && (
            <EyeIcon className="size-3.5 text-emerald-500" aria-label="Visível ao cliente" />
          )}
          {tarefa.data_calculada && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="size-3" />
              {formatarData(tarefa.data_calculada)}
            </span>
          )}
          {responsavel && (
            <Avatar className="size-5">
              <AvatarFallback className="text-[9px]">
                {iniciais(responsavel.full_name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  );
}
