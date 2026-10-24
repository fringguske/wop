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

-- Deleted attendees are moved here instead of being lost.
-- Keep this table's columns in sync with public.attendees: if a column is added there, add it here too.
create table if not exists public.deleted_attendees (
  like public.attendees including defaults,
  deleted_at timestamptz not null default now()
);

-- Copies the attendee into deleted_attendees and removes it from attendees in one statement,
-- so the delete never happens without the backup. Returns the number of rows moved.
create or replace function public.delete_attendee(attendee_id uuid)
returns integer
language sql
as $$
  with removed as (
    delete from public.attendees where id = attendee_id returning *
  ), backed_up as (
    insert into public.deleted_attendees select removed.*, now() from removed returning 1
  )
  select count(*)::integer from backed_up;
$$;
