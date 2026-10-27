-- I may English Academy — schema + RLS
-- Run this once in the Supabase SQL editor (or via `supabase db push`).

-- ------------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  plan text not null default 'individual' check (plan in ('individual','3months','6months')),
  plan_start_date date,
  level text check (level is null or level in ('A2','B1','B2','C1','SLP1','SLP2','SLP3','SLP4')),
  avatar_url text default ''
);

create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('grammar','listening','reading','writing')),
  track text not null check (track in ('civil','military')),
  title text not null,
  level text,
  instructions text default '',
  passage text default '',
  min_words int,
  questions jsonb not null default '[]',
  sort_order double precision not null default 0,
  date_added timestamptz not null default now(),
  audio_url text default '',
  theory_file_url text default '',
  theory_file_name text default '',
  part text default '',
  duration_minutes int,
  icon text default ''
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  track text not null check (track in ('civil','military')),
  title text not null,
  cover_image_url text default '',
  excerpt text default '',
  body text default '',
  date_added timestamptz not null default now(),
  icon text default '',
  cover_position text not null default 'center' check (cover_position in ('top','center','bottom')),
  cover_height int
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  body text not null,
  date_added timestamptz not null default now(),
  featured boolean not null default false
);

create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  track text not null check (track in ('civil','military')),
  category text not null check (category in ('grammar','listening','reading','writing')),
  kind text not null check (kind in ('theory','file')),
  title text not null,
  body text default '',
  file_url text default '',
  file_name text default '',
  date_added timestamptz not null default now(),
  level text check (level is null or level in ('A2','B1','B2','C1','SLP1','SLP2','SLP3','SLP4')),
  icon text default ''
);

-- Private notes the teacher keeps about each student. Admin-only (see policies).
create table if not exists student_notes (
  user_id uuid primary key references profiles(id) on delete cascade,
  city text default '',
  occupation text default '',
  age int,
  marital_status text default '',
  has_children text default '',
  children_detail text default '',
  goal text default '',
  comments text default '',
  rank text default '',
  destination text default '',
  updated_at timestamptz not null default now()
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  score int not null,
  total int not null,
  completed_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create table if not exists writing_drafts (
  user_id uuid not null references profiles(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  content text default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

create table if not exists site_config (
  id int primary key default 1,
  data jsonb not null,
  custom_logo text,
  check (id = 1)
);

-- ------------------------------------------------------------------
-- New-user bootstrap: auto-create a profile row on signup
-- ------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, status, is_admin)
  values (new.id, new.raw_user_meta_data ->> 'name', new.email, 'pending', false);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Prevent a student from granting themselves admin or approving their own account.
create or replace function protect_profile_privileges()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- auth.uid() is null when the update runs outside PostgREST (SQL editor,
  -- migrations, the service_role key) — those are trusted, so only enforce
  -- this check for a logged-in, non-admin API caller.
  if auth.uid() is not null and not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    new.is_admin := old.is_admin;
    new.status := old.status;
    new.plan := old.plan;
    new.plan_start_date := old.plan_start_date;
    new.level := old.level;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges_trigger on profiles;
create trigger protect_profile_privileges_trigger
  before update on profiles
  for each row execute function protect_profile_privileges();

-- Stop an admin (or anyone) from deleting their own profile row via the API,
-- even by accident from the Students tab.
create or replace function prevent_self_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null and old.id = auth.uid() then
    raise exception 'No puedes eliminar tu propia cuenta.';
  end if;
  return old;
end;
$$;

drop trigger if exists prevent_self_delete_trigger on profiles;
create trigger prevent_self_delete_trigger
  before delete on profiles
  for each row execute function prevent_self_delete();

-- Helper used by RLS policies below (SECURITY DEFINER avoids recursive RLS checks).
create or replace function is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function is_approved()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select status = 'approved' from public.profiles where id = auth.uid()), false);
$$;

-- ------------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------------
alter table profiles enable row level security;
alter table exercises enable row level security;
alter table articles enable row level security;
alter table materials enable row level security;
alter table submissions enable row level security;
alter table writing_drafts enable row level security;
alter table site_config enable row level security;
alter table reviews enable row level security;
alter table student_notes enable row level security;

-- profiles
create policy "profiles: read own or admin reads all" on profiles for select
  using (id = auth.uid() or is_admin());
create policy "profiles: user updates own row" on profiles for update
  using (id = auth.uid() or is_admin());
create policy "profiles: admin deletes" on profiles for delete
  using (is_admin());

-- exercises / articles / materials / site_config: public read for approved
-- students, write for admins only.
create policy "exercises: read if approved or admin" on exercises for select
  using (is_approved() or is_admin());
create policy "exercises: admin writes" on exercises for insert
  with check (is_admin());
create policy "exercises: admin updates" on exercises for update
  using (is_admin());
create policy "exercises: admin deletes" on exercises for delete
  using (is_admin());

-- Articles: the full text is only for approved students and admins. Visitors
-- see the list (title, cover, summary) through article_catalog() below.
create policy "articles: read if approved or admin" on articles for select
  using (is_approved() or is_admin());
create policy "articles: admin writes" on articles for insert
  with check (is_admin());
create policy "articles: admin updates" on articles for update
  using (is_admin());
create policy "articles: admin deletes" on articles for delete
  using (is_admin());

-- Reviews (testimonials) are public too.
create policy "reviews: public read" on reviews for select
  using (true);
create policy "reviews: admin writes" on reviews for insert
  with check (is_admin());
create policy "reviews: admin updates" on reviews for update
  using (is_admin());
create policy "reviews: admin deletes" on reviews for delete
  using (is_admin());

create policy "materials: read if approved or admin" on materials for select
  using (is_approved() or is_admin());
create policy "materials: admin writes" on materials for insert
  with check (is_admin());
create policy "materials: admin updates" on materials for update
  using (is_admin());
create policy "materials: admin deletes" on materials for delete
  using (is_admin());

-- Public read: the signup/login screen needs branding (logo, colors, copy)
-- before anyone has an account, so this table is not gated like the others.
create policy "site_config: public read" on site_config for select
  using (true);
create policy "site_config: admin writes" on site_config for insert
  with check (is_admin());
create policy "site_config: admin updates" on site_config for update
  using (is_admin());

-- student_notes: admins only. Students have no policy, so they can never read
-- or write what the teacher notes about them.
create policy "student_notes: admin reads" on student_notes for select
  using (is_admin());
create policy "student_notes: admin inserts" on student_notes for insert
  with check (is_admin());
create policy "student_notes: admin updates" on student_notes for update
  using (is_admin());
create policy "student_notes: admin deletes" on student_notes for delete
  using (is_admin());

-- submissions: a student manages their own rows; admin reads all
create policy "submissions: student reads own, admin reads all" on submissions for select
  using (user_id = auth.uid() or is_admin());
create policy "submissions: student inserts own" on submissions for insert
  with check (user_id = auth.uid());
create policy "submissions: student updates own" on submissions for update
  using (user_id = auth.uid());

-- writing_drafts: a student manages their own rows only
create policy "writing_drafts: own rows" on writing_drafts for select
  using (user_id = auth.uid());
create policy "writing_drafts: insert own" on writing_drafts for insert
  with check (user_id = auth.uid());
create policy "writing_drafts: update own" on writing_drafts for update
  using (user_id = auth.uid());

-- ------------------------------------------------------------------
-- Public catalogs: visitors can SEE what exists (titles, levels, covers…) but
-- never the content itself (questions, texts, audio, files, article bodies).
-- These functions bypass RLS but only return those safe columns.
-- ------------------------------------------------------------------
create or replace function exercise_catalog()
returns table (id uuid, type text, track text, title text, level text, part text, icon text,
               duration_minutes int, min_words int, date_added timestamptz, sort_order double precision, question_count int)
language sql
security definer set search_path = public
stable
as $$
  select e.id, e.type, e.track, e.title, e.level, e.part, coalesce(to_jsonb(e) ->> 'icon', ''),
         e.duration_minutes, e.min_words, e.date_added, e.sort_order,
         (select count(*)::int from jsonb_array_elements(e.questions) q
           where coalesce((q ->> 'example')::boolean, false) = false)
  from exercises e;
$$;

create or replace function material_catalog()
returns table (id uuid, track text, category text, kind text, title text, level text, icon text, date_added timestamptz)
language sql
security definer set search_path = public
stable
as $$
  select m.id, m.track, m.category, m.kind, m.title, m.level, coalesce(to_jsonb(m) ->> 'icon', ''), m.date_added
  from materials m;
$$;

create or replace function article_catalog()
returns table (id uuid, track text, title text, cover_image_url text, excerpt text, icon text,
               cover_position text, cover_height int, date_added timestamptz)
language sql
security definer set search_path = public
stable
as $$
  select a.id, a.track, a.title, a.cover_image_url, a.excerpt, a.icon, a.cover_position, a.cover_height, a.date_added
  from articles a;
$$;

grant execute on function exercise_catalog() to anon, authenticated;
grant execute on function material_catalog() to anon, authenticated;
grant execute on function article_catalog() to anon, authenticated;

-- ------------------------------------------------------------------
-- Storage bucket for uploaded images (logo, banners, etc.)
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media: public read" on storage.objects for select
  using (bucket_id = 'media');
create policy "media: admin uploads" on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());
create policy "media: admin updates" on storage.objects for update
  using (bucket_id = 'media' and public.is_admin());
create policy "media: admin deletes" on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());

-- Approved students may upload / remove only their own profile photo
-- (avatars/<their user id>/...).
create policy "media: students upload own avatar" on storage.objects for insert
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = 'avatars'
              and (storage.foldername(name))[2] = auth.uid()::text and public.is_approved());
create policy "media: students delete own avatar" on storage.objects for delete
  using (bucket_id = 'media' and (storage.foldername(name))[1] = 'avatars'
         and (storage.foldername(name))[2] = auth.uid()::text);

-- ------------------------------------------------------------------
-- Bootstrap the singleton site_config row
-- ------------------------------------------------------------------
insert into site_config (id, data) values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- Making the first admin
-- ------------------------------------------------------------------
-- 1. Sign up as a student through the app (or in the Supabase dashboard).
-- 2. Then run, replacing the email:
--   update profiles set is_admin = true, status = 'approved'
--   where id = (select id from auth.users where email = 'you@example.com');
