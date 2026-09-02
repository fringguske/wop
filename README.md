# Event Attendee App

One password-protected app for event officers to register people as they enter.

## What it does
- `/login` - officers enter the shared event password
- `/register` - officers add full name, phone number, address, church, category, gender, boarding, and boarding days
- `/attendees` - officers view all registered people in one table
- The same password can be used by at least 6 officers at the same time

## Setup

1. Supabase: open Project -> SQL Editor -> New query, paste `supabase/schema.sql`, and run it.
2. Get your Project URL and anon key from Project Settings -> API.
3. Copy `.env.local.example` to `.env.local` and fill in the values.
4. `npm install`
5. `npm run dev`
6. Open http://localhost:3000 and log in with the password you set.

Your local env file should contain:

```bash
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
APP_PASSWORD=your-event-password
```

The app also accepts `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `EVENT_APP_PASSWORD`, `EVENT_PASSWORD`, or `APP_OTP` if you already used one of those names.

## Supabase Table

Run this in the Supabase SQL editor:

```sql
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
```

In Supabase, keep Row Level Security off for `attendees` while using this shared-password app. If RLS is on, inserts and reads from the app will fail unless you add policies for the anon role.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import the repo in Vercel.
3. In Vercel -> Project -> Settings -> Environment Variables, add the same
   three variables from `.env.local`.
4. Deploy. Share the URL and the password with your 10 admins.
