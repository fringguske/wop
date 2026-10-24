create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_number text,
  address text,
  church text,
  category text,
  gender text,
  boarding boolean not null default false,
  boarding_days integer,
  created_at timestamptz not null default now()
);

alter table public.attendees add column if not exists address text;
alter table public.attendees add column if not exists church text;
alter table public.attendees add column if not exists boarding boolean not null default false;
alter table public.attendees add column if not exists boarding_days integer;
alter table public.attendees alter column boarding set default false;

alter table public.attendees add column if not exists registration_amount text;

alter table public.attendees add column if not exists boarding_schedule text[] not null default '{}';
