-- Allow the envelope ritual (`share`) as a stored bowl_release.
-- Picker now offers share instead of set_aside; old drawer / wash rows stay readable.

alter table public.diaries drop constraint if exists diaries_bowl_release_check;

alter table public.diaries
  add constraint diaries_bowl_release_check
  check (
    bowl_release is null
    or bowl_release in (
      'empty',
      'share',
      'set_aside',
      'send_away',
      'wash',
      'let_flow',
      'keep_hug'
    )
  );

comment on column public.diaries.bowl_release is
  'Symbolic release action · empty|share|set_aside|send_away|wash|let_flow|keep_hug';
