-- launchapp — Realtime (Fase 5 habilitada desde já no banco)
-- Publica as tabelas colaborativas na publication do Supabase Realtime.
-- replica identity full garante payload completo em UPDATE/DELETE (necessário p/ filtros no client).

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter table public.tasks           replica identity full;
alter table public.stages          replica identity full;
alter table public.task_comments   replica identity full;
alter table public.task_approvals  replica identity full;
alter table public.notifications   replica identity full;

alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.stages;
alter publication supabase_realtime add table public.task_comments;
alter publication supabase_realtime add table public.task_approvals;
alter publication supabase_realtime add table public.notifications;
