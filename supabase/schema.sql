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

-- Children attending with this person, as a list of { "name", "age", "gender" }. They board on the parent's days.
alter table public.attendees add column if not exists children jsonb not null default '[]';

-- Deleted attendees are moved here instead of being lost.
-- Keep this table's columns in sync with public.attendees: if a column is added there, add it here too.
create table if not exists public.deleted_attendees (
  like public.attendees including defaults,
  deleted_at timestamptz not null default now()
);

alter table public.deleted_attendees add column if not exists children jsonb not null default '[]';

-- Copies the attendee into deleted_attendees and removes it from attendees in one statement,
-- so the delete never happens without the backup. Returns the number of rows moved.
-- Columns are matched by name, because columns added later sit in a different order in the two tables.
create or replace function public.delete_attendee(attendee_id uuid)
returns integer
language sql
as $$
  with removed as (
    delete from public.attendees where id = attendee_id returning *
  ), backed_up as (
    insert into public.deleted_attendees
    select backup.*
    from removed,
      jsonb_populate_record(null::public.deleted_attendees, to_jsonb(removed) || jsonb_build_object('deleted_at', now())) as backup
    returning 1
  )
  select count(*)::integer from backed_up;
$$;

-- Before an attendee is edited, the old version is copied here so the change can be undone.
-- Keep this table's columns in sync with public.attendees too.
create table if not exists public.attendee_history (
  like public.attendees including defaults,
  changed_at timestamptz not null default now()
);

alter table public.attendee_history add column if not exists children jsonb not null default '[]';

create or replace function public.save_attendee_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.attendee_history
  select * from jsonb_populate_record(null::public.attendee_history, to_jsonb(old) || jsonb_build_object('changed_at', now()));
  return new;
end;
$$;

drop trigger if exists save_attendee_history on public.attendees;
create trigger save_attendee_history
before update on public.attendees
for each row execute function public.save_attendee_history();

-- Lets the app save edits when row level security is turned on for attendees (it has no effect otherwise).
drop policy if exists "Allow updating attendees" on public.attendees;
create policy "Allow updating attendees" on public.attendees for update using (true) with check (true);
