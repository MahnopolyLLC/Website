-- Mahnopoly database schema. Applied to the real Supabase project — this
-- is what's live, not just a plan. Kept here so the schema travels with
-- the code and a fresh project can be brought up to match by running this
-- file once. The table definitions are safe to re-run (`if not exists` /
-- `on conflict do nothing`); the `create policy` statements are not —
-- re-running this against a project that already has it applied will
-- fail on those with a "policy already exists" error, which is expected.

create table if not exists listings (
  id text primary key,
  address text not null,
  city text not null default '',
  zip text,
  neighborhood text not null,
  type text not null check (type in ('rental', 'sale')),
  status text not null check (status in ('available', 'rented', 'pending', 'sold')),
  price numeric not null,
  beds int not null,
  baths numeric not null,
  pets text,
  available_date text,
  description text,
  photos jsonb not null default '[]',
  -- Staff-only visibility flag, independent of `status` — lets a listing
  -- be hidden from the public site (tenant moved in, sale closed) without
  -- losing the record, then unarchived later instead of recreated.
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id text references listings(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  message text,
  created_at timestamptz not null default now()
);

-- Single-row settings table (staff-editable via the admin panel) holding
-- the operational links called out in docs/plan.md: the site never
-- hardcodes a tenant portal or maintenance URL.
create table if not exists settings (
  id int primary key default 1,
  tenant_portal_url text,
  pay_rent_url text,
  maintenance_request_url text,
  uhaul_url text,
  show_tenant_buttons boolean not null default false,
  office_address text,
  office_phone text,
  office_hours text,
  epoxy_photos jsonb not null default '[]',
  facebook_url text,
  instagram_url text,
  x_url text,
  constraint settings_singleton check (id = 1)
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- Staff allowlist. Every staff-only policy below checks membership here
-- rather than just "is this user authenticated" — add a staff member by
-- inserting their login email; there's no admin UI for this on purpose
-- (staff onboarding is rare and manual, done directly in the SQL editor).
create table if not exists staff (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table listings enable row level security;
alter table inquiries enable row level security;
alter table settings enable row level security;
alter table staff enable row level security;

-- Public visitors can read listings/settings. Inquiry writes go through the
-- constrained submit_inquiry function below rather than unrestricted table
-- inserts, so validation and database-level volume limits cannot be bypassed
-- by calling PostgREST directly.
create policy "Public can read listings" on listings for select using (true);
create policy "Public can read settings" on settings for select using (true);

create index if not exists inquiries_created_at_idx on inquiries (created_at desc);
create index if not exists inquiries_email_created_at_idx on inquiries (lower(email), created_at desc);

create or replace function submit_inquiry(
  p_listing_id text,
  p_name text,
  p_email text,
  p_phone text default '',
  p_message text default ''
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  clean_name text := btrim(coalesce(p_name, ''));
  clean_email text := lower(btrim(coalesce(p_email, '')));
  clean_phone text := btrim(coalesce(p_phone, ''));
  clean_message text := btrim(coalesce(p_message, ''));
begin
  if length(clean_name) < 1 or length(clean_name) > 100 then
    raise exception 'invalid_name';
  end if;
  if length(clean_email) < 3 or length(clean_email) > 254
     or clean_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid_email';
  end if;
  if length(clean_phone) > 40 or length(clean_message) > 4000 then
    raise exception 'invalid_length';
  end if;

  -- A global ceiling prevents a direct API caller from exhausting the free
  -- database tier. A tighter per-email limit absorbs ordinary repeated spam;
  -- the Server Action adds a honeypot and a per-connection limit before this.
  if (select count(*) from inquiries where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'rate_limit';
  end if;
  if (
    select count(*) from inquiries
    where lower(email) = clean_email
      and created_at > now() - interval '1 hour'
  ) >= 3 then
    raise exception 'rate_limit';
  end if;

  insert into inquiries (listing_id, name, email, phone, message)
  values (p_listing_id, clean_name, clean_email, clean_phone, clean_message)
  returning id into new_id;
  return new_id;
end;
$$;

revoke all on function submit_inquiry(text, text, text, text, text) from public;
grant execute on function submit_inquiry(text, text, text, text, text) to anon, authenticated;

-- A logged-in user can confirm their own staff membership (needed for the
-- `exists` checks below to evaluate at all); nobody can read the whole
-- list or write to it from the app.
create policy "Staff can read own staff row" on staff for select
  using (email = auth.email());

-- Staff (checked against the staff table, not just "is this user
-- authenticated") can manage listings, read inquiries, and edit settings.
create policy "Staff can manage listings" on listings for all
  using (exists (select 1 from staff where email = auth.email()))
  with check (exists (select 1 from staff where email = auth.email()));
create policy "Staff can read inquiries" on inquiries for select
  using (exists (select 1 from staff where email = auth.email()));
create policy "Staff can manage settings" on settings for update
  using (exists (select 1 from staff where email = auth.email()))
  with check (exists (select 1 from staff where email = auth.email()));
