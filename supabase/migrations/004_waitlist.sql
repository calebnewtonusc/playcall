-- Waitlist table for pre-launch signups
create table if not exists public.waitlist (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  name text,
  source text default 'playcall-website',
  created_at timestamptz default now() not null,
  constraint waitlist_email_unique unique (email)
);

-- No auth needed — inserts go through service role key from API route
alter table public.waitlist enable row level security;

-- No public read access
create policy "waitlist_no_public_read" on public.waitlist for select using (false);

-- Index for dedup lookups
create index if not exists idx_waitlist_email on public.waitlist(email);
