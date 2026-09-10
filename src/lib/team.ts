import type { Database } from "@/lib/supabase/database.types";

export const FUNCOES_EQUIPE = ["gestor_projetos", "estrategista_senior", "gestor_trafego", "social_media", "copywriter", "automacao", "comercial", "suporte_alunos", "editor_video", "especialista"] as const;
export const PAPEL_LABEL: Record<Database["public"]["Enums"]["papel_projeto"], string> = {
  owner: "Proprietário", gestor_projetos: "Gestor de projetos", estrategista_senior: "Estrategista sênior",
  gestor_trafego: "Gestor de tráfego", social_media: "Social media", copywriter: "Copywriter",
  automacao: "Automação", comercial: "Comercial", suporte_alunos: "Suporte aos alunos",
  editor_video: "Editor de vídeo", especialista: "Especialista", cliente: "Cliente",
};
export type ConviteEquipe = Pick<Database["public"]["Tables"]["project_invitations"]["Row"], "id" | "email" | "papel">;
