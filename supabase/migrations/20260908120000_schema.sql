-- launchapp — schema base (Fase 2)
-- Domínio: gestão de lançamentos de produto digital (template → projeto → etapa → tarefa).
-- RLS é ativada aqui mesmo e as políticas vêm na migration seguinte (20260908120100_rls.sql).

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Tipos (enums)
-- ─────────────────────────────────────────────────────────────
do $$ begin
  create type papel_projeto as enum (
    'owner','gestor_projetos','estrategista_senior','gestor_trafego',
    'social_media','copywriter','automacao','comercial','suporte_alunos',
    'editor_video','especialista','cliente'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_projeto as enum ('planejamento','em_andamento','concluido','arquivado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_tarefa as enum (
    'backlog','a_fazer','em_andamento','em_revisao','aguardando_aprovacao','concluido','bloqueado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type prioridade as enum ('baixa','media','alta','urgente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recorrencia as enum ('nao','diario','diario_2x','a_cada_3_dias','a_cada_7_dias','semanal','rotineiro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_aprovacao as enum ('pendente','aprovado','reprovado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_sprint as enum ('planejado','ativo','concluido');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- Utilitários
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ─────────────────────────────────────────────────────────────
-- profiles (espelha auth.users)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Usuário',
  avatar_url text,
  phone text,
  created_at timestamptz not null default now()
);

-- Cria profile automaticamente ao criar usuário no Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Usuário'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Templates de lançamento (a lógica da planilha)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.launch_templates (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.template_stages (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.launch_templates(id) on delete cascade,
  nome text not null,
  ordem int not null,
  ancora text not null default 'inicio_vendas',      -- 'inicio_vendas' | 'fim_vendas'
  offset_dias int not null default 0,                -- ex: -49, -7, 0, +10
  duracao_dias int,
  unique (template_id, ordem)
);

create table if not exists public.template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_stage_id uuid not null references public.template_stages(id) on delete cascade,
  ordem int not null default 0,
  subetapa text,
  titulo text not null,
  descricao_operacional text,
  canal text,
  responsavel_papel text,          -- valor textual do enum papel_projeto
  aprovador_papel text,
  dependencia_texto text,
  data_ancora_tipo text not null default 'inicio_etapa',
  regra_data text not null default 'no_dia',          -- 'D-5' | 'D+3' | 'D+0' | 'no_dia'
  recorrencia recorrencia not null default 'nao',
  prioridade prioridade not null default 'media',
  automacao boolean not null default false,
  ferramenta text,
  observacoes text
);

-- ─────────────────────────────────────────────────────────────
-- Projetos (um ciclo de lançamento concreto)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  template_id uuid references public.launch_templates(id) on delete set null,
  data_inicio_vendas date not null,   -- deve ser uma segunda-feira (validado em app + trigger)
  data_fim_vendas date not null,      -- domingo seguinte
  status status_projeto not null default 'planejamento',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendas_semana_valida check (data_fim_vendas > data_inicio_vendas)
);
create trigger trg_projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  papel papel_projeto not null,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index if not exists idx_project_members_user on public.project_members(user_id);

-- Ao criar um projeto, o criador entra como owner automaticamente (resolve o ovo-galinha do RLS).
create or replace function public.handle_new_project()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.created_by is not null then
    insert into public.project_members (project_id, user_id, papel)
    values (new.id, new.created_by, 'owner')
    on conflict (project_id, user_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_project_created on public.projects;
create trigger on_project_created
  after insert on public.projects
  for each row execute function public.handle_new_project();

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  chave text not null,                -- 'data_cpl_1','data_live_1','data_live_downsell','fim_garantia'...
  data date not null,
  unique (project_id, chave)
);

create table if not exists public.stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  template_stage_id uuid references public.template_stages(id) on delete set null,
  nome text not null,
  ordem int not null,
  ancora text not null default 'inicio_vendas',
  offset_dias int not null default 0,
  data_inicio date not null,          -- calculada pelo motor de datas
  data_fim date not null,
  unique (project_id, ordem)
);

create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  nome text not null,
  data_inicio date,
  data_fim date,
  meta text,
  status status_sprint not null default 'planejado',
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.stages(id) on delete cascade,
  template_task_id uuid references public.template_tasks(id) on delete set null,
  subetapa text,
  titulo text not null,
  descricao_operacional text,
  canal text,
  responsavel_id uuid references public.profiles(id) on delete set null,
  aprovador_id uuid references public.profiles(id) on delete set null,
  dependencia_task_id uuid references public.tasks(id) on delete set null,
  dependencia_texto text,
  data_ancora_tipo text not null default 'inicio_etapa',
  regra_data text not null default 'no_dia',
  data_calculada date,                -- recalculada pelo motor de datas
  recorrencia recorrencia not null default 'nao',
  ocorrencia_indice int,              -- para instâncias de tarefas recorrentes (null = tarefa única)
  prioridade prioridade not null default 'media',
  status status_tarefa not null default 'a_fazer',
  automacao boolean not null default false,
  ferramenta text,
  observacoes text,                   -- interno: nunca exposto ao cliente
  visivel_cliente boolean not null default false,
  sprint_id uuid references public.sprints(id) on delete set null,
  story_points int,
  ordem_kanban double precision not null default 0,  -- posição dentro da coluna do Kanban
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_stage on public.tasks(stage_id);
create index if not exists idx_tasks_status on public.tasks(project_id, status);
create index if not exists idx_tasks_responsavel on public.tasks(responsavel_id);
create index if not exists idx_tasks_sprint on public.tasks(sprint_id);
create trigger trg_tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  corpo text not null,
  visivel_cliente boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_comments_task on public.task_comments(task_id);

create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  storage_path text not null,
  nome_arquivo text,
  visivel_cliente boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_attachments_task on public.task_attachments(task_id);

create table if not exists public.task_approvals (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  aprovador_id uuid references public.profiles(id) on delete set null,
  status status_aprovacao not null default 'pendente',
  comentario text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists idx_approvals_task on public.task_approvals(task_id);
create index if not exists idx_approvals_aprovador on public.task_approvals(aprovador_id, status);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entidade text not null,
  entidade_id uuid,
  acao text not null,
  detalhes jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_activity_project on public.activity_log(project_id, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  tipo text not null,
  payload jsonb,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id, lida, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- RLS: ativar em 100% das tabelas AGORA (políticas na migration seguinte)
-- ─────────────────────────────────────────────────────────────
alter table public.profiles           enable row level security;
alter table public.launch_templates   enable row level security;
alter table public.template_stages    enable row level security;
alter table public.template_tasks     enable row level security;
alter table public.projects           enable row level security;
alter table public.project_members    enable row level security;
alter table public.project_milestones enable row level security;
alter table public.stages             enable row level security;
alter table public.sprints            enable row level security;
alter table public.tasks              enable row level security;
alter table public.task_comments      enable row level security;
alter table public.task_attachments   enable row level security;
alter table public.task_approvals     enable row level security;
alter table public.activity_log       enable row level security;
alter table public.notifications      enable row level security;
