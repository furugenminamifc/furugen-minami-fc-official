-- 古堅南FC 公式ホームページ Ver.1.8
-- Supabase SQL Editorで1回だけ実行してください。
-- このSQLは「選手」「スタッフ」「写真Storage」の基盤を作成します。

create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('U-12','U-11','U-10')),
  number integer not null check (number between 1 and 99),
  name text not null,
  name_kana text default '',
  grade text default '',
  position text default 'FP',
  dominant_foot text default '',
  profile text default '',
  photo_url text default '',
  photo_position text default 'center 35%',
  captain boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  staff_group text not null default 'coaching' check (staff_group in ('coaching','referees')),
  role text not null,
  name text not null,
  name_kana text default '',
  category text default '',
  license text default '',
  career text default '',
  message text default '',
  photo_url text default '',
  photo_position text default 'center 35%',
  sns_label text default '',
  sns_url text default '',
  sort_order integer not null default 100,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.players enable row level security;
alter table public.staff enable row level security;

-- 公開ページは公開中データだけ読めます。
drop policy if exists "public read published players" on public.players;
create policy "public read published players"
on public.players for select
to anon, authenticated
using (is_published = true or auth.role() = 'authenticated');

drop policy if exists "public read published staff" on public.staff;
create policy "public read published staff"
on public.staff for select
to anon, authenticated
using (is_published = true or auth.role() = 'authenticated');

-- 管理画面からの追加・更新・削除はログイン済みユーザーだけ。
-- Supabase Dashboard > Authentication で管理者ユーザーを作成し、
-- public signup はOFFにする運用を推奨します。
drop policy if exists "authenticated manage players" on public.players;
create policy "authenticated manage players"
on public.players for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage staff" on public.staff;
create policy "authenticated manage staff"
on public.staff for all
to authenticated
using (true)
with check (true);

-- 写真保存用Storage
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = true;

drop policy if exists "public read site media" on storage.objects;
create policy "public read site media"
on storage.objects for select
to public
using (bucket_id = 'site-media');

drop policy if exists "authenticated upload site media" on storage.objects;
create policy "authenticated upload site media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'site-media');

drop policy if exists "authenticated update site media" on storage.objects;
create policy "authenticated update site media"
on storage.objects for update
to authenticated
using (bucket_id = 'site-media')
with check (bucket_id = 'site-media');

drop policy if exists "authenticated delete site media" on storage.objects;
create policy "authenticated delete site media"
on storage.objects for delete
to authenticated
using (bucket_id = 'site-media');
