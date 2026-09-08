-- launchapp — RLS policies (Fase 2)
-- Princípios:
--  * Todo acesso é escopado por project_id via project_members.
--  * Cliente é allow-list: só enxerga o que está marcado visivel_cliente = true.
--  * Cliente nunca vê observações internas, custos, sprints, auditoria ou tarefas de outros projetos.
--  * Helpers são SECURITY DEFINER com search_path fixo para evitar recursão de RLS e o
--    alerta "function_search_path_mutable" dos advisors.

-- ─────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────
create or replace function public.member_role(p_project uuid)
returns papel_projeto language sql stable security definer set search_path = '' as $$
  select m.papel
  from public.project_members m
  where m.project_id = p_project and m.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_member(p_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = p_project and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_client(p_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.member_role(p_project) = 'cliente';
$$;

-- Membro da equipe = pertence ao projeto e NÃO é cliente.
create or replace function public.is_team(p_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_member(p_project) and public.member_role(p_project) <> 'cliente';
$$;

-- Pode gerenciar membros/estrutura do projeto.
create or replace function public.can_manage(p_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.member_role(p_project) in ('owner','gestor_projetos');
$$;

-- Compartilha ao menos um projeto com o usuário alvo (para leitura de profiles).
create or replace function public.shares_project(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.project_members me
    join public.project_members other on other.project_id = me.project_id
    where me.user_id = auth.uid() and other.user_id = p_user
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────
create policy "profiles_select_self_or_shared" on public.profiles
  for select using (id = auth.uid() or public.shares_project(id));
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- launch_templates + template_stages + template_tasks
-- Templates são compartilhados entre a equipe (recurso global do workspace).
-- Cliente não tem acesso a templates.
-- ─────────────────────────────────────────────────────────────
create policy "templates_select_auth" on public.launch_templates
  for select using (auth.uid() is not null);
create policy "templates_insert_own" on public.launch_templates
  for insert with check (created_by = auth.uid());
create policy "templates_update_own" on public.launch_templates
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "templates_delete_own" on public.launch_templates
  for delete using (created_by = auth.uid());

create policy "template_stages_select_auth" on public.template_stages
  for select using (auth.uid() is not null);
create policy "template_stages_write_owner" on public.template_stages
  for all using (
    exists (select 1 from public.launch_templates t
            where t.id = template_id and t.created_by = auth.uid())
  ) with check (
    exists (select 1 from public.launch_templates t
            where t.id = template_id and t.created_by = auth.uid())
  );

create policy "template_tasks_select_auth" on public.template_tasks
  for select using (auth.uid() is not null);
create policy "template_tasks_write_owner" on public.template_tasks
  for all using (
    exists (
      select 1 from public.template_stages s
      join public.launch_templates t on t.id = s.template_id
      where s.id = template_stage_id and t.created_by = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.template_stages s
      join public.launch_templates t on t.id = s.template_id
      where s.id = template_stage_id and t.created_by = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- projects
-- ─────────────────────────────────────────────────────────────
create policy "projects_select_member" on public.projects
  for select using (public.is_member(id));
-- Qualquer usuário autenticado pode criar um projeto (vira owner via trigger).
create policy "projects_insert_creator" on public.projects
  for insert with check (created_by = auth.uid());
create policy "projects_update_manager" on public.projects
  for update using (public.can_manage(id)) with check (public.can_manage(id));
create policy "projects_delete_manager" on public.projects
  for delete using (public.can_manage(id));

-- ─────────────────────────────────────────────────────────────
-- project_members
-- ─────────────────────────────────────────────────────────────
create policy "members_select_member" on public.project_members
  for select using (public.is_member(project_id));
create policy "members_write_manager" on public.project_members
  for all using (public.can_manage(project_id))
  with check (public.can_manage(project_id));

-- ─────────────────────────────────────────────────────────────
-- project_milestones
-- ─────────────────────────────────────────────────────────────
create policy "milestones_select_member" on public.project_milestones
  for select using (public.is_member(project_id));
create policy "milestones_write_team" on public.project_milestones
  for all using (public.is_team(project_id)) with check (public.is_team(project_id));

-- ─────────────────────────────────────────────────────────────
-- stages (cliente vê a Timeline macro; edição só equipe)
-- ─────────────────────────────────────────────────────────────
create policy "stages_select_member" on public.stages
  for select using (public.is_member(project_id));
create policy "stages_write_team" on public.stages
  for all using (public.is_team(project_id)) with check (public.is_team(project_id));

-- ─────────────────────────────────────────────────────────────
-- sprints (operacional interno — cliente não vê)
-- ─────────────────────────────────────────────────────────────
create policy "sprints_select_team" on public.sprints
  for select using (public.is_team(project_id));
create policy "sprints_write_team" on public.sprints
  for all using (public.is_team(project_id)) with check (public.is_team(project_id));

-- ─────────────────────────────────────────────────────────────
-- tasks  (equipe vê tudo; cliente só visivel_cliente = true)
-- ─────────────────────────────────────────────────────────────
create policy "tasks_select_scoped" on public.tasks
  for select using (
    public.is_member(project_id) and (public.is_team(project_id) or visivel_cliente = true)
  );
create policy "tasks_write_team" on public.tasks
  for all using (public.is_team(project_id)) with check (public.is_team(project_id));

-- ─────────────────────────────────────────────────────────────
-- task_comments
--   ver: equipe tudo; cliente só comentários visíveis de tarefas visíveis.
--   inserir: equipe em qualquer tarefa; cliente só em tarefa visível (e só comentário visível).
-- ─────────────────────────────────────────────────────────────
create policy "comments_select_scoped" on public.task_comments
  for select using (
    public.is_team(project_id)
    or (
      public.is_member(project_id)
      and visivel_cliente = true
      and exists (select 1 from public.tasks t where t.id = task_id and t.visivel_cliente = true)
    )
  );
create policy "comments_insert_scoped" on public.task_comments
  for insert with check (
    author_id = auth.uid() and (
      public.is_team(project_id)
      or (
        public.is_client(project_id)
        and visivel_cliente = true
        and exists (select 1 from public.tasks t where t.id = task_id and t.visivel_cliente = true)
      )
    )
  );
create policy "comments_update_own_or_manager" on public.task_comments
  for update using (author_id = auth.uid() or public.can_manage(project_id))
  with check (author_id = auth.uid() or public.can_manage(project_id));
create policy "comments_delete_own_or_manager" on public.task_comments
  for delete using (author_id = auth.uid() or public.can_manage(project_id));

-- ─────────────────────────────────────────────────────────────
-- task_attachments (cliente só vê anexos marcados visíveis em tarefa visível)
-- ─────────────────────────────────────────────────────────────
create policy "attachments_select_scoped" on public.task_attachments
  for select using (
    public.is_team(project_id)
    or (
      public.is_member(project_id)
      and visivel_cliente = true
      and exists (select 1 from public.tasks t where t.id = task_id and t.visivel_cliente = true)
    )
  );
create policy "attachments_write_team" on public.task_attachments
  for all using (public.is_team(project_id)) with check (public.is_team(project_id));

-- ─────────────────────────────────────────────────────────────
-- task_approvals
--   ver: equipe tudo; cliente só as aprovações onde ele é o aprovador.
--   inserir: equipe cria pedidos de aprovação.
--   atualizar: o aprovador designado (inclui cliente) decide; equipe gestora também.
-- ─────────────────────────────────────────────────────────────
create policy "approvals_select_scoped" on public.task_approvals
  for select using (public.is_team(project_id) or aprovador_id = auth.uid());
create policy "approvals_insert_team" on public.task_approvals
  for insert with check (public.is_team(project_id));
create policy "approvals_update_approver_or_manager" on public.task_approvals
  for update using (aprovador_id = auth.uid() or public.can_manage(project_id))
  with check (aprovador_id = auth.uid() or public.can_manage(project_id));
create policy "approvals_delete_manager" on public.task_approvals
  for delete using (public.can_manage(project_id));

-- ─────────────────────────────────────────────────────────────
-- activity_log (auditoria interna — cliente não vê; inserção por membros/triggers)
-- ─────────────────────────────────────────────────────────────
create policy "activity_select_team" on public.activity_log
  for select using (public.is_team(project_id));
create policy "activity_insert_member" on public.activity_log
  for insert with check (public.is_member(project_id) and actor_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- notifications (cada usuário só as suas)
-- ─────────────────────────────────────────────────────────────
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_delete_own" on public.notifications
  for delete using (user_id = auth.uid());
-- Inserção de notificações para outros usuários é feita por Server Actions com service_role
-- ou por triggers SECURITY DEFINER — não há policy de insert direto pelo usuário.
