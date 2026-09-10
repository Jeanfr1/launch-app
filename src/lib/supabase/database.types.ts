export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          acao: string
          actor_id: string | null
          created_at: string
          detalhes: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          project_id: string
        }
        Insert: {
          acao: string
          actor_id?: string | null
          created_at?: string
          detalhes?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          project_id: string
        }
        Update: {
          acao?: string
          actor_id?: string | null
          created_at?: string
          detalhes?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_attempts: {
        Row: {
          actor_id: string
          created_at: string
        }
        Insert: {
          actor_id: string
          created_at?: string
        }
        Update: {
          actor_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_attempts_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_templates: {
        Row: {
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "launch_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          payload: Json | null
          project_id: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          payload?: Json | null
          project_id?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          payload?: Json | null
          project_id?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      project_invitations: {
        Row: {
          created_at: string
          email: string
          id: string
          papel: Database["public"]["Enums"]["papel_projeto"]
          project_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          papel: Database["public"]["Enums"]["papel_projeto"]
          project_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          papel?: Database["public"]["Enums"]["papel_projeto"]
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string
          papel: Database["public"]["Enums"]["papel_projeto"]
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          papel: Database["public"]["Enums"]["papel_projeto"]
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          papel?: Database["public"]["Enums"]["papel_projeto"]
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          chave: string
          data: string
          id: string
          project_id: string
        }
        Insert: {
          chave: string
          data: string
          id?: string
          project_id: string
        }
        Update: {
          chave?: string
          data?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: string | null
          data_fim_vendas: string
          data_inicio_vendas: string
          id: string
          nome: string
          status: Database["public"]["Enums"]["status_projeto"]
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_fim_vendas: string
          data_inicio_vendas: string
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["status_projeto"]
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_fim_vendas?: string
          data_inicio_vendas?: string
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["status_projeto"]
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "launch_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_events: {
        Row: {
          created_at: string
          id: string
          project_id: string
          remaining_delta: number
          sprint_id: string
          task_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          remaining_delta: number
          sprint_id: string
          task_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          remaining_delta?: number
          sprint_id?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sprint_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sprint_events_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          meta: string | null
          nome: string
          project_id: string
          status: Database["public"]["Enums"]["status_sprint"]
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          meta?: string | null
          nome: string
          project_id: string
          status?: Database["public"]["Enums"]["status_sprint"]
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          meta?: string | null
          nome?: string
          project_id?: string
          status?: Database["public"]["Enums"]["status_sprint"]
        }
        Relationships: [
          {
            foreignKeyName: "sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          ancora: string
          data_fim: string
          data_inicio: string
          id: string
          nome: string
          offset_dias: number
          ordem: number
          project_id: string
          template_stage_id: string | null
        }
        Insert: {
          ancora?: string
          data_fim: string
          data_inicio: string
          id?: string
          nome: string
          offset_dias?: number
          ordem: number
          project_id: string
          template_stage_id?: string | null
        }
        Update: {
          ancora?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          nome?: string
          offset_dias?: number
          ordem?: number
          project_id?: string
          template_stage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stages_template_stage_id_fkey"
            columns: ["template_stage_id"]
            isOneToOne: false
            referencedRelation: "template_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      task_approvals: {
        Row: {
          aprovador_id: string | null
          comentario: string | null
          created_at: string
          decided_at: string | null
          id: string
          project_id: string
          status: Database["public"]["Enums"]["status_aprovacao"]
          task_id: string
        }
        Insert: {
          aprovador_id?: string | null
          comentario?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["status_aprovacao"]
          task_id: string
        }
        Update: {
          aprovador_id?: string | null
          comentario?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["status_aprovacao"]
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_task_scope"
            columns: ["project_id", "task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "task_approvals_aprovador_id_fkey"
            columns: ["aprovador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_approvals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string
          id: string
          nome_arquivo: string | null
          project_id: string
          storage_path: string
          task_id: string
          uploaded_by: string | null
          visivel_cliente: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          nome_arquivo?: string | null
          project_id: string
          storage_path: string
          task_id: string
          uploaded_by?: string | null
          visivel_cliente?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          nome_arquivo?: string | null
          project_id?: string
          storage_path?: string
          task_id?: string
          uploaded_by?: string | null
          visivel_cliente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "attachment_task_scope"
            columns: ["project_id", "task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "task_attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string | null
          corpo: string
          created_at: string
          id: string
          project_id: string
          task_id: string
          visivel_cliente: boolean
        }
        Insert: {
          author_id?: string | null
          corpo: string
          created_at?: string
          id?: string
          project_id: string
          task_id: string
          visivel_cliente?: boolean
        }
        Update: {
          author_id?: string | null
          corpo?: string
          created_at?: string
          id?: string
          project_id?: string
          task_id?: string
          visivel_cliente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "comment_task_scope"
            columns: ["project_id", "task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_private: {
        Row: {
          observacoes: string | null
          project_id: string
          task_id: string
        }
        Insert: {
          observacoes?: string | null
          project_id: string
          task_id: string
        }
        Update: {
          observacoes?: string | null
          project_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_task_scope"
            columns: ["project_id", "task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "task_private_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_private_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          aprovador_id: string | null
          automacao: boolean
          canal: string | null
          created_at: string
          data_ancora_tipo: string
          data_calculada: string | null
          dependencia_task_id: string | null
          dependencia_texto: string | null
          descricao_operacional: string | null
          ferramenta: string | null
          id: string
          ocorrencia_indice: number | null
          ordem_kanban: number
          prioridade: Database["public"]["Enums"]["prioridade"]
          project_id: string
          recorrencia: Database["public"]["Enums"]["recorrencia"]
          recurrence_parent_id: string | null
          recurrence_until: string | null
          regra_data: string
          responsavel_id: string | null
          sprint_id: string | null
          stage_id: string | null
          status: Database["public"]["Enums"]["status_tarefa"]
          story_points: number | null
          subetapa: string | null
          template_task_id: string | null
          titulo: string
          updated_at: string
          visivel_cliente: boolean
        }
        Insert: {
          aprovador_id?: string | null
          automacao?: boolean
          canal?: string | null
          created_at?: string
          data_ancora_tipo?: string
          data_calculada?: string | null
          dependencia_task_id?: string | null
          dependencia_texto?: string | null
          descricao_operacional?: string | null
          ferramenta?: string | null
          id?: string
          ocorrencia_indice?: number | null
          ordem_kanban?: number
          prioridade?: Database["public"]["Enums"]["prioridade"]
          project_id: string
          recorrencia?: Database["public"]["Enums"]["recorrencia"]
          recurrence_parent_id?: string | null
          recurrence_until?: string | null
          regra_data?: string
          responsavel_id?: string | null
          sprint_id?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["status_tarefa"]
          story_points?: number | null
          subetapa?: string | null
          template_task_id?: string | null
          titulo: string
          updated_at?: string
          visivel_cliente?: boolean
        }
        Update: {
          aprovador_id?: string | null
          automacao?: boolean
          canal?: string | null
          created_at?: string
          data_ancora_tipo?: string
          data_calculada?: string | null
          dependencia_task_id?: string | null
          dependencia_texto?: string | null
          descricao_operacional?: string | null
          ferramenta?: string | null
          id?: string
          ocorrencia_indice?: number | null
          ordem_kanban?: number
          prioridade?: Database["public"]["Enums"]["prioridade"]
          project_id?: string
          recorrencia?: Database["public"]["Enums"]["recorrencia"]
          recurrence_parent_id?: string | null
          recurrence_until?: string | null
          regra_data?: string
          responsavel_id?: string | null
          sprint_id?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["status_tarefa"]
          story_points?: number | null
          subetapa?: string | null
          template_task_id?: string | null
          titulo?: string
          updated_at?: string
          visivel_cliente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "task_dependency_scope"
            columns: ["project_id", "dependencia_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "task_parent_scope"
            columns: ["project_id", "recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "task_sprint_scope"
            columns: ["project_id", "sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "task_stage_scope"
            columns: ["project_id", "stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["project_id", "id"]
          },
          {
            foreignKeyName: "tasks_aprovador_id_fkey"
            columns: ["aprovador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_dependencia_task_id_fkey"
            columns: ["dependencia_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_template_task_id_fkey"
            columns: ["template_task_id"]
            isOneToOne: false
            referencedRelation: "template_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      template_stages: {
        Row: {
          ancora: string
          duracao_dias: number | null
          id: string
          nome: string
          offset_dias: number
          ordem: number
          template_id: string
        }
        Insert: {
          ancora?: string
          duracao_dias?: number | null
          id?: string
          nome: string
          offset_dias?: number
          ordem: number
          template_id: string
        }
        Update: {
          ancora?: string
          duracao_dias?: number | null
          id?: string
          nome?: string
          offset_dias?: number
          ordem?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_stages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "launch_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_tasks: {
        Row: {
          aprovador_papel: string | null
          automacao: boolean
          canal: string | null
          data_ancora_tipo: string
          dependencia_texto: string | null
          descricao_operacional: string | null
          ferramenta: string | null
          id: string
          observacoes: string | null
          ordem: number
          prioridade: Database["public"]["Enums"]["prioridade"]
          recorrencia: Database["public"]["Enums"]["recorrencia"]
          regra_data: string
          responsavel_papel: string | null
          subetapa: string | null
          template_stage_id: string
          titulo: string
        }
        Insert: {
          aprovador_papel?: string | null
          automacao?: boolean
          canal?: string | null
          data_ancora_tipo?: string
          dependencia_texto?: string | null
          descricao_operacional?: string | null
          ferramenta?: string | null
          id?: string
          observacoes?: string | null
          ordem?: number
          prioridade?: Database["public"]["Enums"]["prioridade"]
          recorrencia?: Database["public"]["Enums"]["recorrencia"]
          regra_data?: string
          responsavel_papel?: string | null
          subetapa?: string | null
          template_stage_id: string
          titulo: string
        }
        Update: {
          aprovador_papel?: string | null
          automacao?: boolean
          canal?: string | null
          data_ancora_tipo?: string
          dependencia_texto?: string | null
          descricao_operacional?: string | null
          ferramenta?: string | null
          id?: string
          observacoes?: string | null
          ordem?: number
          prioridade?: Database["public"]["Enums"]["prioridade"]
          recorrencia?: Database["public"]["Enums"]["recorrencia"]
          regra_data?: string
          responsavel_papel?: string | null
          subetapa?: string | null
          template_stage_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_tasks_template_stage_id_fkey"
            columns: ["template_stage_id"]
            isOneToOne: false
            referencedRelation: "template_stages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_project_person: {
        Args: {
          p_email: string
          p_project: string
          p_role: Database["public"]["Enums"]["papel_projeto"]
        }
        Returns: string
      }
      add_project_person_unlimited: {
        Args: {
          p_email: string
          p_project: string
          p_role: Database["public"]["Enums"]["papel_projeto"]
        }
        Returns: string
      }
      can_manage: { Args: { p_project: string }; Returns: boolean }
      claim_project_invitations: { Args: never; Returns: undefined }
      expand_task_series: { Args: { p_task: string }; Returns: number }
      is_client: { Args: { p_project: string }; Returns: boolean }
      is_member: { Args: { p_project: string }; Returns: boolean }
      is_team: { Args: { p_project: string }; Returns: boolean }
      member_role: {
        Args: { p_project: string }
        Returns: Database["public"]["Enums"]["papel_projeto"]
      }
      remove_project_person: {
        Args: { p_invitation?: string; p_project: string; p_user?: string }
        Returns: undefined
      }
      shares_project: { Args: { p_user: string }; Returns: boolean }
    }
    Enums: {
      papel_projeto:
        | "owner"
        | "gestor_projetos"
        | "estrategista_senior"
        | "gestor_trafego"
        | "social_media"
        | "copywriter"
        | "automacao"
        | "comercial"
        | "suporte_alunos"
        | "editor_video"
        | "especialista"
        | "cliente"
      prioridade: "baixa" | "media" | "alta" | "urgente"
      recorrencia:
        | "nao"
        | "diario"
        | "diario_2x"
        | "a_cada_3_dias"
        | "a_cada_7_dias"
        | "semanal"
        | "rotineiro"
      status_aprovacao: "pendente" | "aprovado" | "reprovado"
      status_projeto:
        | "planejamento"
        | "em_andamento"
        | "concluido"
        | "arquivado"
      status_sprint: "planejado" | "ativo" | "concluido"
      status_tarefa:
        | "backlog"
        | "a_fazer"
        | "em_andamento"
        | "em_revisao"
        | "aguardando_aprovacao"
        | "concluido"
        | "bloqueado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      papel_projeto: [
        "owner",
        "gestor_projetos",
        "estrategista_senior",
        "gestor_trafego",
        "social_media",
        "copywriter",
        "automacao",
        "comercial",
        "suporte_alunos",
        "editor_video",
        "especialista",
        "cliente",
      ],
      prioridade: ["baixa", "media", "alta", "urgente"],
      recorrencia: [
        "nao",
        "diario",
        "diario_2x",
        "a_cada_3_dias",
        "a_cada_7_dias",
        "semanal",
        "rotineiro",
      ],
      status_aprovacao: ["pendente", "aprovado", "reprovado"],
      status_projeto: [
        "planejamento",
        "em_andamento",
        "concluido",
        "arquivado",
      ],
      status_sprint: ["planejado", "ativo", "concluido"],
      status_tarefa: [
        "backlog",
        "a_fazer",
        "em_andamento",
        "em_revisao",
        "aguardando_aprovacao",
        "concluido",
        "bloqueado",
      ],
    },
  },
} as const
