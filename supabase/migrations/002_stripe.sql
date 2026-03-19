-- Add Stripe fields to profiles
alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists is_pro boolean not null default false;
