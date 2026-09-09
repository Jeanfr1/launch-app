import type { Database } from "@/lib/supabase/database.types";
import type { StatusTarefa, Prioridade } from "@/lib/constants";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

/** Campos de tarefa usados nas visões (Kanban/Lista). */
export type TarefaBoard = Pick<
  TaskRow,
  | "id"
  | "titulo"
  | "subetapa"
  | "canal"
  | "status"
  | "prioridade"
  | "stage_id"
  | "responsavel_id"
  | "data_calculada"
  | "visivel_cliente"
  | "ordem_kanban"
  | "story_points"
>;

export type EtapaBoard = {
  id: string;
  nome: string;
  ordem: number;
  data_inicio: string;
  data_fim: string;
};

export type MembroBoard = {
  user_id: string;
  papel: Database["public"]["Enums"]["papel_projeto"];
  full_name: string | null;
  avatar_url: string | null;
};

export type { StatusTarefa, Prioridade };
