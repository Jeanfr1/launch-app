begin;

create table public.project_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null check (email = lower(trim(email)) and length(email) <= 254),
  papel public.papel_projeto not null check (papel not in ('owner', 'cliente')),
  created_at timestamptz not null default now(),
  unique (project_id, email)
);
alter table public.project_invitations enable row level security;
create policy invitations_select_manager on public.project_invitations
  for select to authenticated using (public.can_manage(project_id));

-- All membership changes go through the checked functions below. The project
-- creation trigger remains responsible for creating the immutable owner.
drop policy members_write_manager on public.project_members;

create function public.add_project_person(p_project uuid, p_email text, p_role public.papel_projeto)
returns text language plpgsql security definer set search_path = '' as $$
declare target_user uuid; normalized_email text := lower(trim(p_email));
begin
  perform 1 from public.projects where id = p_project for update;
  if not coalesce(public.can_manage(p_project), false) then
    raise exception 'Você não tem permissão para gerenciar esta equipe.';
  end if;
  if p_role is null or p_role in ('owner', 'cliente') then
    raise exception 'Escolha uma função da equipe.';
  end if;
  if normalized_email is null or length(normalized_email) > 254 or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Informe um e-mail válido.';
  end if;
  select id into target_user from auth.users
    where lower(email) = normalized_email and email_confirmed_at is not null limit 1;
  if target_user is not null then
    if exists (select 1 from public.project_members where project_id = p_project and user_id = target_user) then
      raise exception 'Esta pessoa já faz parte do projeto.';
    end if;
    insert into public.project_members(project_id, user_id, papel) values(p_project, target_user, p_role);
    delete from public.project_invitations where project_id = p_project and email = normalized_email;
    return 'adicionado';
  end if;
  insert into public.project_invitations(project_id, email, papel) values(p_project, normalized_email, p_role)
    on conflict (project_id, email) do update set papel = excluded.papel;
  return 'pendente';
end;
$$;

create function public.claim_project_invitations()
returns void language plpgsql security definer set search_path = '' as $$
declare verified_email text; project_uuid uuid;
begin
  select lower(email) into verified_email from auth.users
    where id = auth.uid() and email_confirmed_at is not null;
  if verified_email is null then return; end if;
  -- Match the project lock order used by managers; concurrent renders are safe.
  for project_uuid in select project_id from public.project_invitations
    where email = verified_email order by project_id
  loop
    perform 1 from public.projects where id = project_uuid for update;
    insert into public.project_members(project_id, user_id, papel)
      select project_id, auth.uid(), papel from public.project_invitations
      where project_id = project_uuid and email = verified_email
      on conflict (project_id, user_id) do nothing;
    delete from public.project_invitations where project_id = project_uuid and email = verified_email;
  end loop;
end;
$$;

create function public.remove_project_person(p_project uuid, p_user uuid default null, p_invitation uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.projects where id = p_project for update;
  if not coalesce(public.can_manage(p_project), false) then
    raise exception 'Você não tem permissão para gerenciar esta equipe.';
  end if;
  if (p_user is null) = (p_invitation is null) then raise exception 'Dados inválidos.'; end if;
  if p_user is not null then
    if p_user = auth.uid() or exists (select 1 from public.project_members
        where project_id = p_project and user_id = p_user and papel = 'owner') then
      raise exception 'Não é possível remover o proprietário ou seu próprio acesso.';
    end if;
    delete from public.project_members where project_id = p_project and user_id = p_user;
    -- Removed people must no longer remain assigned to this project's tasks.
    update public.tasks set responsavel_id = null where project_id = p_project and responsavel_id = p_user;
    update public.tasks set aprovador_id = null where project_id = p_project and aprovador_id = p_user;
    update public.task_approvals set aprovador_id = null where project_id = p_project and aprovador_id = p_user;
  else
    delete from public.project_invitations where project_id = p_project and id = p_invitation;
  end if;
end;
$$;

revoke all on function public.add_project_person(uuid, text, public.papel_projeto) from public, anon;
revoke all on function public.claim_project_invitations() from public, anon;
revoke all on function public.remove_project_person(uuid, uuid, uuid) from public, anon;
grant execute on function public.add_project_person(uuid, text, public.papel_projeto) to authenticated;
grant execute on function public.claim_project_invitations() to authenticated;
grant execute on function public.remove_project_person(uuid, uuid, uuid) to authenticated;
commit;
