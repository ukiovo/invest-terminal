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
