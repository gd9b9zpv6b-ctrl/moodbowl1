-- Widen diaries.soup check to include drink-metaphor keys used by the app.
-- Safe to re-run.

alter table public.diaries drop constraint if exists diaries_soup_check;

alter table public.diaries
  add constraint diaries_soup_check check (
    soup is null or soup in (
      -- legacy food/drink set
      'hot_milk_tea', 'cold_lemon_tea', 'curry',
      'plain_congee', 'sweet_soup', 'no_appetite',
      -- current drink metaphors
      'strawberry_milk', 'marble_soda', 'lemon_juice',
      'spicy_ginger', 'bitter_tea', 'warm_milk',
      'plain_water', 'no_drink'
    )
  );
