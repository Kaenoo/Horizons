-- Rappels Horizons : abonnements push Web et travaux de rappel.
-- RLS activée et verrouillée : les Edge Functions passent par le rôle service.

create extension if not exists "pg_cron";
create extension if not exists pg_net;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_uid text not null,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_device_uid_idx
  on public.push_subscriptions (device_uid);

create table if not exists public.reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  device_uid text not null,
  goal_id text not null,
  title text not null,
  fire_at timestamptz not null,
  recurrence text not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (device_uid, goal_id)
);

create index if not exists reminder_jobs_fire_at_idx
  on public.reminder_jobs (fire_at);

alter table public.push_subscriptions enable row level security;
alter table public.reminder_jobs enable row level security;

-- Aucune politique : l'accès passe uniquement par le rôle service (Edge Functions).