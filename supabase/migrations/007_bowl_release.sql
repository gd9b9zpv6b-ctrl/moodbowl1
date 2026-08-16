-- Persist symbolic release choice · 「想點處理呢個情緒」
-- empty | set_aside | send_away | wash | keep_hug

alter table public.diaries
  add column if not exists bowl_release text
    check (
      bowl_release is null
      or bowl_release in ('empty', 'set_aside', 'send_away', 'wash', 'keep_hug')
    );

comment on column public.diaries.bowl_release is
  'Symbolic release action · how the student wants to handle today''s feeling';
