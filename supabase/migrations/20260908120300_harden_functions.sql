-- launchapp — endurecimento das funções (resolve WARNs dos advisors)
--  * search_path fixo em todas as funções.
--  * SECURITY DEFINER: remove EXECUTE de public/anon; concede só a authenticated onde é
--    chamado dentro de policies. Funções de trigger não precisam de EXECUTE por nenhum role.

-- set_updated_at: faltava o search_path fixo.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Helpers usados dentro de policies: só authenticated pode executar.
do $$
declare fn text;
begin
  foreach fn in array array[
    'public.member_role(uuid)','public.is_member(uuid)','public.is_client(uuid)',
    'public.is_team(uuid)','public.can_manage(uuid)','public.shares_project(uuid)'
  ] loop
    execute format('revoke execute on function %s from public, anon;', fn);
    execute format('grant execute on function %s to authenticated;', fn);
  end loop;
end $$;

-- Funções de trigger: ninguém precisa chamar diretamente.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_project() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
