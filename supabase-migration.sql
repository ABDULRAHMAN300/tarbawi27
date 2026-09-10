-- تحديث قاعدة البيانات لدعم المهام المتكررة
-- شغّله مرة واحدة في: Supabase ← SQL Editor ← New query ← Run
-- آمن تمامًا: لا يمسّ مهامك الحالية.

alter table public.tasks add column if not exists meta jsonb default '{}'::jsonb;
