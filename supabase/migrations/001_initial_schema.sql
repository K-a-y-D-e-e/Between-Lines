-- Between Lines: schema, RLS, storage. Run once in the Supabase SQL editor.

create type public.writing_kind as enum ('poem', 'fragment', 'letter');
create type public.writing_status as enum ('draft', 'published');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  username text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- One table for poems, fragments and letters: the three differ only in `kind`
-- (and `recipient`, used by letters).
create table public.writings (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  kind public.writing_kind not null default 'poem',
  title text not null default '',
  content text not null default '',
  recipient text,
  cover_url text,
  status public.writing_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index writings_status_published_idx on public.writings (status, published_at desc);
create index writings_author_idx on public.writings (author_id);
create index writings_kind_idx on public.writings (kind);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name = lower(name) and char_length(name) between 1 and 40)
);

create table public.writing_tags (
  writing_id uuid not null references public.writings (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (writing_id, tag_id)
);
create index writing_tags_tag_idx on public.writing_tags (tag_id);

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  writing_id uuid not null references public.writings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, writing_id)
);

-- Helpers ---------------------------------------------------------------
create function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

-- Hard limit: only two accounts can ever exist.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare base text;
begin
  if (select count(*) from public.profiles) >= 2 then
    raise exception 'Between Lines is limited to two accounts.';
  end if;
  base := split_part(new.email, '@', 1);
  insert into public.profiles (id, display_name, username)
  values (new.id, initcap(base), lower(regexp_replace(base, '[^a-zA-Z0-9_]', '', 'g')));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.touch_writing() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

create trigger writings_touch
  before insert or update on public.writings
  for each row execute function public.touch_writing();

-- Row Level Security ------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.writings enable row level security;
alter table public.tags enable row level security;
alter table public.writing_tags enable row level security;
alter table public.favorites enable row level security;

create policy "members read profiles" on public.profiles
  for select to authenticated using (public.is_member());
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "read published or own writings" on public.writings
  for select to authenticated
  using (public.is_member() and (status = 'published' or author_id = auth.uid()));
create policy "insert own writings" on public.writings
  for insert to authenticated with check (public.is_member() and author_id = auth.uid());
create policy "update own writings" on public.writings
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "delete own writings" on public.writings
  for delete to authenticated using (author_id = auth.uid());

create policy "members read tags" on public.tags
  for select to authenticated using (public.is_member());
create policy "members create tags" on public.tags
  for insert to authenticated with check (public.is_member());

-- Tag links follow the visibility of the writing they belong to.
create policy "read visible tag links" on public.writing_tags
  for select to authenticated
  using (exists (select 1 from public.writings w where w.id = writing_id));
create policy "insert own tag links" on public.writing_tags
  for insert to authenticated
  with check (exists (select 1 from public.writings w where w.id = writing_id and w.author_id = auth.uid()));
create policy "delete own tag links" on public.writing_tags
  for delete to authenticated
  using (exists (select 1 from public.writings w where w.id = writing_id and w.author_id = auth.uid()));

-- You see your own favorites, plus who saved your writing.
create policy "read favorites" on public.favorites
  for select to authenticated
  using (user_id = auth.uid()
    or exists (select 1 from public.writings w where w.id = writing_id and w.author_id = auth.uid()));
create policy "favorite published writings" on public.favorites
  for insert to authenticated
  with check (user_id = auth.uid()
    and exists (select 1 from public.writings w where w.id = writing_id and w.status = 'published'));
create policy "remove own favorites" on public.favorites
  for delete to authenticated using (user_id = auth.uid());

-- Storage: images for covers and avatars, stored under <user id>/ --------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "members upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_member()
    and (storage.foldername(name))[1] = auth.uid()::text);
create policy "members delete own media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
