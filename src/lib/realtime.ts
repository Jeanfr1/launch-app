"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TarefaBoard } from "@/lib/types";

type TaskRow = {
  id: string;
  titulo: string;
  subetapa: string | null;
  canal: string | null;
  status: TarefaBoard["status"];
  prioridade: TarefaBoard["prioridade"];
  stage_id: string | null;
  responsavel_id: string | null;
  data_calculada: string | null;
  visivel_cliente: boolean;
  ordem_kanban: number;
  story_points: number | null;
};

function toBoard(row: TaskRow): TarefaBoard {
  return {
    id: row.id,
    titulo: row.titulo,
    subetapa: row.subetapa,
    canal: row.canal,
    status: row.status,
    prioridade: row.prioridade,
    stage_id: row.stage_id,
    responsavel_id: row.responsavel_id,
    data_calculada: row.data_calculada,
    visivel_cliente: row.visivel_cliente,
    ordem_kanban: row.ordem_kanban,
    story_points: row.story_points,
  };
}

/**
 * Fase 5 — sincroniza as tarefas do projeto em tempo real (Supabase Realtime).
 * Qualquer INSERT/UPDATE/DELETE feito por outro usuário aparece sem F5.
 * A RLS filtra os eventos: cada usuário só recebe o que pode ver.
 */
export function useRealtimeTarefas(
  projectId: string,
  setTarefas: (updater: (prev: TarefaBoard[]) => TarefaBoard[]) => void,
) {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`tasks:${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` },
        (payload) => {
          setTarefas((prev) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id?: string }).id;
              return prev.filter((t) => t.id !== oldId);
            }
            const row = toBoard(payload.new as TaskRow);
            const i = prev.findIndex((t) => t.id === row.id);
            if (i === -1) return [...prev, row];
            const copy = prev.slice();
            copy[i] = row;
            return copy;
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [projectId, setTarefas]);
}

export type Presenca = { id: string; nome: string };

/**
 * Presence por projeto: lista de quem está com o board aberto agora.
 * Canal público `project:<id>`; cada cliente publica {id, nome}.
 */
export function usePresence(projectId: string, me: Presenca): Presenca[] {
  const [online, setOnline] = useState<Presenca[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`project:${projectId}`, {
      config: { presence: { key: me.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, Array<Partial<Presenca>>>;
        const seen = new Set<string>();
        const list: Presenca[] = [];
        for (const arr of Object.values(state)) {
          const p = arr[0];
          if (p?.id && !seen.has(p.id)) {
            seen.add(p.id);
            list.push({ id: p.id, nome: p.nome ?? "Usuário" });
          }
        }
        setOnline(list);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void channel.track({ id: me.id, nome: me.nome });
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [projectId, me.id, me.nome]);

  return online;
}
