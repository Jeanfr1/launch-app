begin;

-- Keep internal notes out of rows that can be read or streamed to clients.
create table public.task_private (
 task_id uuid primary key references public.tasks(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade,
 observacoes text
);
alter table public.task_private enable row level security;
create policy private_team on public.task_private for all to authenticated using(public.is_team(project_id)) with check(public.is_team(project_id));
insert into public.task_private select id, project_id, observacoes from public.tasks where observacoes is not null;
alter table public.tasks drop column observacoes;
alter table public.tasks add column recurrence_parent_id uuid references public.tasks(id) on delete cascade;
alter table public.tasks add column recurrence_until date;
create unique index tasks_occurrence_unique on public.tasks(recurrence_parent_id, ocorrencia_indice) where recurrence_parent_id is not null;

-- Cross-project references must remain impossible even through the REST API.
alter table public.tasks add constraint tasks_project_id_id_key unique(project_id,id);
alter table public.stages add constraint stages_project_id_id_key unique(project_id,id);
alter table public.sprints add constraint sprints_project_id_id_key unique(project_id,id);
alter table public.tasks add constraint task_stage_scope foreign key(project_id,stage_id) references public.stages(project_id,id);
alter table public.tasks add constraint task_sprint_scope foreign key(project_id,sprint_id) references public.sprints(project_id,id);
alter table public.tasks add constraint task_dependency_scope foreign key(project_id,dependencia_task_id) references public.tasks(project_id,id);
alter table public.tasks add constraint task_parent_scope foreign key(project_id,recurrence_parent_id) references public.tasks(project_id,id);
alter table public.task_comments add constraint comment_task_scope foreign key(project_id,task_id) references public.tasks(project_id,id);
alter table public.task_approvals add constraint approval_task_scope foreign key(project_id,task_id) references public.tasks(project_id,id);
alter table public.task_attachments add constraint attachment_task_scope foreign key(project_id,task_id) references public.tasks(project_id,id);
alter table public.task_private add constraint private_task_scope foreign key(project_id,task_id) references public.tasks(project_id,id);
alter table public.tasks add constraint points_valid check(story_points between 0 and 100);
alter table public.sprints add constraint sprint_dates_valid check(data_fim >= data_inicio);

create function public.validate_task() returns trigger language plpgsql security definer set search_path='' as $$
declare base date; shift int := 0; root public.tasks; step int; multiplier int;
begin
 if TG_OP='UPDATE' and (new.project_id<>old.project_id or new.recurrence_parent_id is distinct from old.recurrence_parent_id) then raise exception 'O projeto e a série da tarefa não podem ser alterados.'; end if;
 if new.responsavel_id is not null and not exists(select 1 from public.project_members where project_id=new.project_id and user_id=new.responsavel_id and papel<>'cliente') then raise exception 'Responsável deve pertencer à equipe do projeto.'; end if;
 if new.aprovador_id is not null and not exists(select 1 from public.project_members where project_id=new.project_id and user_id=new.aprovador_id) then raise exception 'Aprovador deve pertencer ao projeto.'; end if;
 if new.dependencia_task_id=new.id or exists(with recursive deps as(select id,dependencia_task_id from public.tasks where id=new.dependencia_task_id union select t.id,t.dependencia_task_id from public.tasks t join deps d on t.id=d.dependencia_task_id) select 1 from deps where id=new.id) then raise exception 'A dependência criaria um ciclo.'; end if;
 if new.recurrence_parent_id is not null then
   select * into root from public.tasks where id=new.recurrence_parent_id;
   step := case root.recorrencia when 'a_cada_3_dias' then 3 when 'a_cada_7_dias' then 7 when 'semanal' then 7 else 1 end;
   multiplier := case root.recorrencia when 'diario_2x' then 2 else 1 end;
   new.data_calculada := root.data_calculada + (new.ocorrencia_indice / multiplier)*step;
 else
   select case new.data_ancora_tipo when 'inicio_vendas' then p.data_inicio_vendas when 'fim_vendas' then p.data_fim_vendas when 'inicio_etapa' then s.data_inicio when 'fim_etapa' then s.data_fim else m.data end into base
   from public.projects p left join public.stages s on s.id=new.stage_id left join public.project_milestones m on m.project_id=p.id and m.chave=new.data_ancora_tipo where p.id=new.project_id;
   if lower(trim(new.regra_data)) ~ '^d\s*[+-]?[0-9]+$' then shift := regexp_replace(lower(new.regra_data),'[d\s]','','g')::int;
   elsif trim(new.regra_data) ~ '^[+-]?[0-9]+$' then shift := trim(new.regra_data)::int;
   elsif lower(trim(new.regra_data)) not in ('no_dia','no dia','') then raise exception 'Regra de data inválida. Use D-5, D+3 ou no_dia.'; end if;
   if abs(shift)>3650 then raise exception 'Deslocamento de data muito grande.'; end if;
   new.data_calculada := base + shift;
 end if;
 return new;
end $$;
create trigger validate_task before insert or update on public.tasks for each row execute function public.validate_task();

create function public.expand_task_series(p_task uuid) returns int language plpgsql security definer set search_path='' as $$
declare t public.tasks; until_date date; step int; multiplier int; n int; added int:=0;
begin
 select * into t from public.tasks where id=p_task for update;
 if not coalesce(public.is_team(t.project_id),false) then raise exception 'Sem acesso à tarefa.'; end if;
 if t.recurrence_parent_id is not null or t.recorrencia='nao' or t.data_calculada is null then return 0; end if;
 select coalesce(t.recurrence_until,s.data_fim,p.data_fim_vendas) into until_date from public.projects p left join public.stages s on s.id=t.stage_id where p.id=t.project_id;
 if until_date<t.data_calculada then return 0; end if;
 if until_date-t.data_calculada>366 then raise exception 'A recorrência deve cobrir no máximo 366 dias.'; end if;
 step:=case t.recorrencia when 'a_cada_3_dias' then 3 when 'a_cada_7_dias' then 7 when 'semanal' then 7 else 1 end;
 multiplier:=case t.recorrencia when 'diario_2x' then 2 else 1 end;
 for n in 1..(((until_date-t.data_calculada)/step+1)*multiplier-1) loop
 insert into public.tasks(project_id,stage_id,titulo,descricao_operacional,canal,responsavel_id,data_ancora_tipo,regra_data,prioridade,visivel_cliente,recorrencia,recurrence_parent_id,ocorrencia_indice,ordem_kanban)
 values(t.project_id,t.stage_id,t.titulo,t.descricao_operacional,t.canal,t.responsavel_id,t.data_ancora_tipo,t.regra_data,t.prioridade,t.visivel_cliente,t.recorrencia,t.id,n,t.ordem_kanban+n*0.001)
 on conflict(recurrence_parent_id,ocorrencia_indice) where recurrence_parent_id is not null do update set data_calculada=excluded.data_calculada;
 added:=added+1;
 end loop;
 return added;
end $$;

create function public.sync_task_series() returns trigger language plpgsql set search_path='' as $$
begin
 if new.recurrence_parent_id is null and new.recorrencia<>'nao' then perform public.expand_task_series(new.id); end if;
 return new;
end $$;
create trigger sync_task_series after insert or update of data_ancora_tipo,regra_data,stage_id,recorrencia,recurrence_until,data_calculada on public.tasks for each row execute function public.sync_task_series();
create function public.refresh_milestone_tasks() returns trigger language plpgsql set search_path='' as $$
begin
 update public.tasks set data_calculada=data_calculada where project_id=coalesce(new.project_id,old.project_id) and recurrence_parent_id is null;
 return coalesce(new,old);
end $$;
create trigger refresh_milestone_tasks after insert or update or delete on public.project_milestones for each row execute function public.refresh_milestone_tasks();

-- Client-facing collaboration: every mutation is scoped to a visible task.
drop policy approvals_select_scoped on public.task_approvals;
create policy approvals_select_scoped on public.task_approvals for select using(public.is_team(project_id) or (public.is_member(project_id) and aprovador_id=auth.uid() and exists(select 1 from public.tasks where id=task_id and visivel_cliente)));
drop policy approvals_update_approver_or_manager on public.task_approvals;
create policy approvals_update_approver_or_manager on public.task_approvals for update using(public.can_manage(project_id) or (public.is_member(project_id) and aprovador_id=auth.uid() and exists(select 1 from public.tasks where id=task_id and (public.is_team(project_id) or visivel_cliente)))) with check(public.is_member(project_id));
create function public.guard_approval() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.project_members where project_id=new.project_id and user_id=new.aprovador_id) then raise exception 'Aprovador deve pertencer ao projeto.'; end if;
 if TG_OP='UPDATE' then
  if (new.project_id,new.task_id,new.aprovador_id) is distinct from (old.project_id,old.task_id,old.aprovador_id) then raise exception 'A aprovação não pode ser transferida.'; end if;
  if old.status<>'pendente' then raise exception 'Esta aprovação já foi respondida.'; end if;
  if new.status not in ('aprovado','reprovado') then raise exception 'Resposta inválida.'; end if;
  new.decided_at:=now();
 end if;
 return new;
end $$;
create trigger guard_approval before insert or update on public.task_approvals for each row execute function public.guard_approval();
-- Restrict client comment edits to visible tasks and prevent reparenting.
drop policy comments_update_own_or_manager on public.task_comments;
create policy comments_update_own_or_manager on public.task_comments for update using(public.is_member(project_id) and (author_id=auth.uid() or public.can_manage(project_id))) with check(public.is_member(project_id) and (public.is_team(project_id) or (visivel_cliente and exists(select 1 from public.tasks where id=task_id and visivel_cliente))));
drop policy comments_delete_own_or_manager on public.task_comments;
create policy comments_delete_own_or_manager on public.task_comments for delete using(public.is_member(project_id) and (author_id=auth.uid() or public.can_manage(project_id)));
create function public.guard_comment() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' and (new.project_id,new.task_id,new.author_id) is distinct from (old.project_id,old.task_id,old.author_id) then raise exception 'O comentário não pode ser transferido.'; end if;
 if length(trim(new.corpo)) not between 1 and 10000 then raise exception 'Comentário inválido.'; end if;
 return new;
end $$;
create trigger guard_comment before insert or update on public.task_comments for each row execute function public.guard_comment();

create table public.sprint_events (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
 sprint_id uuid not null references public.sprints(id) on delete cascade, task_id uuid,
 remaining_delta int not null, created_at timestamptz not null default now()
);
alter table public.sprint_events enable row level security;
create policy sprint_events_team on public.sprint_events for select using(public.is_team(project_id));
create function public.track_task_work() returns trigger language plpgsql security definer set search_path='' as $$
declare before_points int:=0; after_points int:=0;
begin
 if TG_OP<>'INSERT' and old.sprint_id is not null then
 before_points:=case when old.status='concluido' then 0 else coalesce(old.story_points,0) end;
 insert into public.sprint_events(project_id,sprint_id,task_id,remaining_delta) values(old.project_id,old.sprint_id,old.id,-before_points);
 end if;
 if TG_OP<>'DELETE' and new.sprint_id is not null then
 after_points:=case when new.status='concluido' then 0 else coalesce(new.story_points,0) end;
 insert into public.sprint_events(project_id,sprint_id,task_id,remaining_delta) values(new.project_id,new.sprint_id,new.id,after_points);
 end if;
 return coalesce(new,old);
end $$;
create trigger track_task_work after insert or delete or update of status,story_points,sprint_id on public.tasks for each row execute function public.track_task_work();

-- Notifications are produced in the same transaction as the collaboration event.
create function public.notify_collaboration() returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid; task_title text;
begin
 if TG_TABLE_NAME='task_approvals' then
  if TG_OP='INSERT' then target:=new.aprovador_id;
  else select responsavel_id into target from public.tasks where id=new.task_id; end if;
 elsif TG_TABLE_NAME='task_comments' then select responsavel_id into target from public.tasks where id=new.task_id;
 else target:=new.responsavel_id; end if;
 if target is not null and target is distinct from auth.uid() and public.is_member(new.project_id) then
  select titulo into task_title from public.tasks where id=case when TG_TABLE_NAME='tasks' then new.id else (to_jsonb(new)->>'task_id')::uuid end;
  insert into public.notifications(user_id,project_id,tipo,payload) values(target,new.project_id,TG_TABLE_NAME,jsonb_build_object('titulo',task_title,'task_id',case when TG_TABLE_NAME='tasks' then new.id else (to_jsonb(new)->>'task_id')::uuid end));
 end if;
 return new;
end $$;
create trigger notify_comment after insert on public.task_comments for each row execute function public.notify_collaboration();
create trigger notify_approval after insert or update on public.task_approvals for each row execute function public.notify_collaboration();
create trigger notify_assignment after insert or update of responsavel_id on public.tasks for each row execute function public.notify_collaboration();

-- Private storage, paths are project UUID / task UUID / file UUID-name.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('task-attachments','task-attachments',false,10485760,array['application/pdf','image/png','image/jpeg','image/webp','text/plain','text/csv','application/zip','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']) on conflict(id) do nothing;
create policy task_files_read on storage.objects for select to authenticated using(bucket_id='task-attachments' and exists(select 1 from public.task_attachments a join public.tasks t on t.id=a.task_id where a.storage_path=name and (public.is_team(a.project_id) or (public.is_member(a.project_id) and a.visivel_cliente and t.visivel_cliente))));
create policy task_files_insert on storage.objects for insert to authenticated with check(bucket_id='task-attachments' and exists(select 1 from public.tasks t where t.project_id::text=(storage.foldername(name))[1] and t.id::text=(storage.foldername(name))[2] and public.is_team(t.project_id)));
create policy task_files_delete on storage.objects for delete to authenticated using(bucket_id='task-attachments' and exists(select 1 from public.projects p where p.id::text=(storage.foldername(name))[1] and public.is_team(p.id)));
create function public.guard_attachment() returns trigger language plpgsql set search_path='' as $$
begin
 if split_part(new.storage_path,'/',1)<>new.project_id::text or split_part(new.storage_path,'/',2)<>new.task_id::text then raise exception 'Caminho de anexo inválido.'; end if;
 return new;
end $$;
create trigger guard_attachment before insert or update on public.task_attachments for each row execute function public.guard_attachment();

-- Presence uses authenticated, private project channels.
create policy board_presence_read on realtime.messages for select to authenticated using(extension='presence' and exists(select 1 from public.projects p where realtime.topic()='project:'||p.id::text and public.is_member(p.id)));
create policy board_presence_write on realtime.messages for insert to authenticated with check(extension='presence' and exists(select 1 from public.projects p where realtime.topic()='project:'||p.id::text and public.is_member(p.id)));
do $$ declare t text; begin
 foreach t in array array['project_members','project_milestones','sprints','sprint_events','task_attachments'] loop
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then execute format('alter publication supabase_realtime add table public.%I',t); end if;
 end loop;
end $$;

-- Rate limit all invitation attempts under an actor lock. Allow client invitations.
alter table public.project_invitations drop constraint project_invitations_papel_check;
alter table public.project_invitations add check(papel<>'owner');
create table public.invitation_attempts(actor_id uuid not null references public.profiles(id) on delete cascade, created_at timestamptz not null default now());
alter table public.invitation_attempts enable row level security;
create index invitation_attempts_actor_date on public.invitation_attempts(actor_id,created_at);
alter function public.add_project_person(uuid,text,public.papel_projeto) rename to add_project_person_unlimited;
-- Replace the old function body to include client roles without duplicating logic.
do $$ declare body text; begin
 select pg_get_functiondef('public.add_project_person_unlimited(uuid,text,public.papel_projeto)'::regprocedure) into body;
 body:=replace(body,$old$p_role in ('owner', 'cliente')$old$,$new$p_role = 'owner'$new$);
 execute body;
end $$;
create function public.add_project_person(p_project uuid,p_email text,p_role public.papel_projeto) returns text language plpgsql security definer set search_path='' as $$
begin
 if not coalesce(public.can_manage(p_project),false) then raise exception 'Sem permissão para gerenciar a equipe.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 delete from public.invitation_attempts where actor_id=auth.uid() and created_at<now()-interval '1 hour';
 if (select count(*) from public.invitation_attempts where actor_id=auth.uid())>=20 then raise exception 'Limite de 20 convites por hora atingido. Tente mais tarde.'; end if;
 insert into public.invitation_attempts(actor_id) values(auth.uid());
 return public.add_project_person_unlimited(p_project,p_email,p_role);
end $$;
revoke all on function public.add_project_person_unlimited(uuid,text,public.papel_projeto) from public,anon,authenticated;
revoke all on function public.add_project_person(uuid,text,public.papel_projeto) from public,anon;
grant execute on function public.add_project_person(uuid,text,public.papel_projeto) to authenticated;
revoke all on function public.expand_task_series(uuid) from public,anon;
grant execute on function public.expand_task_series(uuid) to authenticated;
do $$ declare fn text; begin
 foreach fn in array array['validate_task','sync_task_series','refresh_milestone_tasks','guard_approval','guard_comment','track_task_work','notify_collaboration','guard_attachment'] loop
 execute format('revoke execute on function public.%I() from public,anon,authenticated',fn);
 end loop;
end $$;
commit;
