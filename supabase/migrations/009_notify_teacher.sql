-- Semantic fix: 「想老師留意」= notify_teacher (not class-wide share).
-- Adds notify_teacher and keeps shared_with_class mirrored for legacy readers.

alter table public.diaries
  add column if not exists notify_teacher boolean not null default false;

update public.diaries
set notify_teacher = coalesce(shared_with_class, false)
where notify_teacher is distinct from coalesce(shared_with_class, false);

comment on column public.diaries.notify_teacher is
  'Student opted to notify teacher only · no diary/emotion/size details';

comment on column public.diaries.shared_with_class is
  'Deprecated mirror of notify_teacher · not class-wide diary sharing';

-- Keep the two columns in sync whichever side writers touch
create or replace function public.sync_notify_teacher_mirror()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.notify_teacher is distinct from coalesce(new.shared_with_class, false)
       and new.notify_teacher = false
       and coalesce(new.shared_with_class, false) = true then
      new.notify_teacher := true;
    elsif new.shared_with_class is distinct from new.notify_teacher then
      -- Prefer explicit notify_teacher when set true; else mirror class flag
      if new.notify_teacher then
        new.shared_with_class := true;
      else
        new.notify_teacher := coalesce(new.shared_with_class, false);
        new.shared_with_class := new.notify_teacher;
      end if;
    end if;
    return new;
  end if;

  -- UPDATE
  if new.notify_teacher is distinct from old.notify_teacher then
    new.shared_with_class := new.notify_teacher;
  elsif new.shared_with_class is distinct from old.shared_with_class then
    new.notify_teacher := new.shared_with_class;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_diaries_sync_notify_teacher on public.diaries;
create trigger trg_diaries_sync_notify_teacher
  before insert or update of notify_teacher, shared_with_class
  on public.diaries
  for each row
  execute function public.sync_notify_teacher_mirror();
