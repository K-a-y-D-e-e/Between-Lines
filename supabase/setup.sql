-- Run AFTER creating the two auth users (see README).
-- Names your two profiles. The first account created becomes "Karmadeept".
-- Change the values below freely; you can also edit them later in Settings.
with ordered as (
  select id, row_number() over (order by created_at) as n from public.profiles
)
update public.profiles p
set display_name = case o.n when 1 then 'Karmadeept' else 'Saanchi' end,
    username     = case o.n when 1 then 'karmadeept' else 'saanchi' end
from ordered o
where o.id = p.id;
