-- ─────────────────────────────────────────────────────────────
-- 首页「账户总览」持久化表 · 在 Supabase SQL Editor 里执行
-- 每个用户一行，整份组合(accounts / trades / fx)存成 JSON。
-- RLS 开启，用户只能读写自己的那行。
-- ─────────────────────────────────────────────────────────────

create table if not exists public.portfolio (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.portfolio enable row level security;

-- 幂等：重复执行不报错
drop policy if exists "portfolio_select_own" on public.portfolio;
drop policy if exists "portfolio_insert_own" on public.portfolio;
drop policy if exists "portfolio_update_own" on public.portfolio;
drop policy if exists "portfolio_delete_own" on public.portfolio;

create policy "portfolio_select_own" on public.portfolio
  for select using (auth.uid() = user_id);
create policy "portfolio_insert_own" on public.portfolio
  for insert with check (auth.uid() = user_id);
create policy "portfolio_update_own" on public.portfolio
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "portfolio_delete_own" on public.portfolio
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 压力测试页持仓持久化表（每用户一行，holdings 存成 JSON）
-- ─────────────────────────────────────────────────────────────
create table if not exists public.stress (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.stress enable row level security;

drop policy if exists "stress_select_own" on public.stress;
drop policy if exists "stress_insert_own" on public.stress;
drop policy if exists "stress_update_own" on public.stress;
drop policy if exists "stress_delete_own" on public.stress;

create policy "stress_select_own" on public.stress
  for select using (auth.uid() = user_id);
create policy "stress_insert_own" on public.stress
  for insert with check (auth.uid() = user_id);
create policy "stress_update_own" on public.stress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "stress_delete_own" on public.stress
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 日记页 · 每条日记一行（会随时间增长，故用行表而非单份 JSON）
-- ─────────────────────────────────────────────────────────────
create table if not exists public.diary (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  kind        text not null default 'trade',  -- 'trade' 交易日记 / 'life' 生活日记
  entry_date  date,
  title       text,
  mood        text,        -- 情绪/心理状态
  ticker      text,        -- 关联标的（可选）
  body        text,        -- 正文
  next_action text,        -- 下一步/提醒（可选）
  images      jsonb not null default '[]'::jsonb  -- 存储桶里的图片路径数组
);

-- 若 diary 表在加入 kind 之前就已建好，补上这一列（幂等）
alter table public.diary add column if not exists kind text not null default 'trade';

alter table public.diary enable row level security;

drop policy if exists "diary_select_own" on public.diary;
drop policy if exists "diary_insert_own" on public.diary;
drop policy if exists "diary_update_own" on public.diary;
drop policy if exists "diary_delete_own" on public.diary;

create policy "diary_select_own" on public.diary for select using (auth.uid() = user_id);
create policy "diary_insert_own" on public.diary for insert with check (auth.uid() = user_id);
create policy "diary_update_own" on public.diary for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "diary_delete_own" on public.diary for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 日记图片存储桶（私有）。图片路径约定：{user_id}/{uuid}.{ext}
-- 用签名 URL 读取，每用户只能读写自己文件夹。
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('diary-images', 'diary-images', false)
on conflict (id) do nothing;

drop policy if exists "diary_img_select_own" on storage.objects;
drop policy if exists "diary_img_insert_own" on storage.objects;
drop policy if exists "diary_img_delete_own" on storage.objects;

create policy "diary_img_select_own" on storage.objects for select
  using (bucket_id = 'diary-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "diary_img_insert_own" on storage.objects for insert
  with check (bucket_id = 'diary-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "diary_img_delete_own" on storage.objects for delete
  using (bucket_id = 'diary-images' and auth.uid()::text = (storage.foldername(name))[1]);
