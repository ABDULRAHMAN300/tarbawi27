-- ============================================================
-- إعداد قاعدة البيانات لتطبيق «مهام التقويم التربوي»
-- شغّل هذا الملف كاملًا مرة واحدة في: Supabase → SQL Editor → New query
-- ============================================================

-- جدول المهام
create table if not exists public.tasks (
  id         text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  title      text not null,
  note       text default '',
  cat        text default 'tahdeer',
  prio       text default 'متوسطة',
  done       boolean default false,
  ts         bigint default 0,
  updated_at timestamptz default now()
);

create index if not exists tasks_user_date_idx on public.tasks (user_id, date);

alter table public.tasks enable row level security;

drop policy if exists "tasks_own" on public.tasks;
create policy "tasks_own" on public.tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- جدول أحداث التقويم المحذوفة
create table if not exists public.removed_events (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  ids        text[] default '{}',
  updated_at timestamptz default now()
);

alter table public.removed_events enable row level security;

drop policy if exists "removed_own" on public.removed_events;
create policy "removed_own" on public.removed_events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
