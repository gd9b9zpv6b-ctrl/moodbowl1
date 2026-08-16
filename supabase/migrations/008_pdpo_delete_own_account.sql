-- PDPO · allow a signed-in user to fully erase their account (security definer).
-- Safe to re-run. App still works if this is not applied yet (client wipes RLS-owned rows).

create or replace function public.delete_own_account()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_diaries int := 0;
  v_tasks int := 0;
  v_react int := 0;
  v_hist int := 0;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  delete from public.diary_reactions where user_id = v_uid;
  get diagnostics v_react = row_count;

  delete from public.relax_games_history where user_id = v_uid;
  get diagnostics v_hist = row_count;

  delete from public.tasks where user_id = v_uid;
  get diagnostics v_tasks = row_count;

  delete from public.diaries where user_id = v_uid;
  get diagnostics v_diaries = row_count;

  update public.profiles
  set
    display_name = '(已刪除)',
    avatar_url = null,
    updated_at = now()
  where id = v_uid;

  -- Removes auth user · related rows cascade via FK on delete where defined
  delete from auth.users where id = v_uid;

  return json_build_object(
    'deleted', true,
    'diaries', v_diaries,
    'tasks', v_tasks,
    'reactions', v_react,
    'regulation_history', v_hist
  );
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

comment on function public.delete_own_account() is
  'PDPO erasure · signed-in user wipes own diaries/tasks and deletes auth user';
