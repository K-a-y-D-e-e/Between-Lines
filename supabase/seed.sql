-- OPTIONAL demo content (original writing). Run after setup.sql.
-- Everything is tagged "demo". To remove it all, run the two lines at the bottom.
do $$
declare a uuid; b uuid;
begin
  select id into a from public.profiles order by created_at limit 1;
  select id into b from public.profiles order by created_at offset 1 limit 1;
  if a is null or b is null then
    raise exception 'Create both accounts before running the seed.';
  end if;

  insert into public.writings (author_id, kind, title, content, recipient, status, published_at) values
  (a, 'poem', '3:17 AM',
   E'The refrigerator hums a note\nI keep almost singing back.\n\nOutside, the street lamp\nholds its one long breath.\n\nI count the windows still lit\nand call it company.', null, 'published', now() - interval '7 days'),
  (b, 'poem', 'the things I didn''t say',
   E'I don''t remember\nwhen the silence became\nsomething I understood.\n\nIt sat between us like a table\nwe both kept setting\nfor a guest who never came.\n\nSome conversations\nare better left unfinished,\nlike a window left ajar.', null, 'published', now() - interval '1 day'),
  (a, 'poem', 'Directions to a small kitchen',
   E'Left at the smell of toasted cumin.\nPast the chair that leans.\nThe light switch is a lie;\nuse the lamp.\n\nSomeone will already be there,\nnot waiting, exactly,\njust stirring.', null, 'published', now() - interval '20 days'),
  (b, 'poem', 'Weather report for the far side',
   E'Distance is a kind of weather:\nit arrives without asking,\nrearranges the furniture of a day.\n\nForecast: clear,\nwith a chance of your name\nin the middle of a sentence.', null, 'published', now() - interval '12 days'),
  (a, 'fragment', '', E'3:42 AM. Still awake, listening to the building settle.', null, 'published', now() - interval '3 days'),
  (b, 'fragment', '', E'Saw a dog today with the exact posture of a person about to apologise.', null, 'published', now() - interval '2 days'),
  (a, 'letter', 'On the long way home',
   E'Dear you,\n\nI took the longer road tonight on purpose. There is a stretch where the trees close over the street and the radio loses its nerve, and for about a minute everything is only engine and dark.\n\nI wanted to tell you that I understand quiet better now. It is not the absence of the thing; it is the thing, waiting.\n\nMore soon.', 'You', 'published', now() - interval '5 days'),
  (b, 'letter', 'A list of small and specific things',
   E'Hello,\n\nThings I noticed this week: the way the kettle ticks as it cools. A neighbour teaching a parrot to say good morning. The fact that I reach for my phone at exactly the moment I think of something worth telling you.\n\nI kept the list. I thought you might want it.', 'You', 'published', now() - interval '9 days');

  insert into public.tags (name) values ('demo'), ('night'), ('memory'), ('home'), ('distance'), ('silence'), ('fragment')
  on conflict (name) do nothing;

  insert into public.writing_tags (writing_id, tag_id)
  select w.id, t.id
  from public.writings w
  join (values
    ('3:17 AM','demo'), ('3:17 AM','night'),
    ('the things I didn''t say','demo'), ('the things I didn''t say','silence'),
    ('Directions to a small kitchen','demo'), ('Directions to a small kitchen','home'),
    ('Weather report for the far side','demo'), ('Weather report for the far side','distance'),
    ('On the long way home','demo'), ('On the long way home','night'),
    ('A list of small and specific things','demo'), ('A list of small and specific things','memory')
  ) as m(title, tag) on m.title = w.title
  join public.tags t on t.name = m.tag;

  insert into public.writing_tags (writing_id, tag_id)
  select w.id, t.id from public.writings w, public.tags t
  where w.kind = 'fragment' and w.title = '' and t.name in ('demo', 'fragment')
  on conflict do nothing;
end $$;

-- To remove all demo content:
-- delete from public.writings where id in (select writing_id from public.writing_tags wt join public.tags t on t.id = wt.tag_id where t.name = 'demo');
-- delete from public.tags where name = 'demo';
