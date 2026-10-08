-- Subscriptions and billing.
--   plan:           trial | pro | institution
--   billing_status: trialing | active | cancelled | expired
-- Pro is paid monthly per staff seat through PayFast. Institution is set up by
-- Innovo platform admins (invoice / EFT). Platform admins never pay.

alter table organizations add column if not exists plan text not null default 'trial';
alter table organizations add column if not exists billing_status text not null default 'trialing';
alter table organizations add column if not exists trial_ends_at timestamptz;
alter table organizations add column if not exists paid_until timestamptz;
alter table organizations add column if not exists seats int not null default 0;
alter table organizations add column if not exists seat_price_cents int not null default 8900;
alter table organizations add column if not exists payfast_token text;
alter table organizations add column if not exists billing_company text;
alter table organizations add column if not exists billing_vat text;
alter table organizations add column if not exists billing_address text;
alter table organizations add column if not exists billing_email text;

-- Every organisation that exists today was set up by Innovo, so keep it working
-- as a manually managed Institution account.
update organizations set plan = 'institution', billing_status = 'active'
  where plan = 'trial' and trial_ends_at is null;

-- One row per PayFast checkout started from the Billing page.
create table if not exists billing_checkouts (
  id text primary key,
  org_id text not null references organizations(id) on delete cascade,
  user_id text not null,
  seats int not null,
  amount_cents int not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Every payment notification PayFast sends (kept for the record and to ignore repeats).
create table if not exists billing_payments (
  id text primary key,
  org_id text,
  pf_payment_id text unique,
  m_payment_id text,
  payment_status text not null,
  amount_gross_cents int,
  token text,
  raw text not null,
  created_at timestamptz not null default now()
);

create index if not exists billing_payments_org_idx on billing_payments (org_id, created_at desc);

-- Accounts created before email verification existed are treated as verified.
update "user" set "emailVerified" = true where "emailVerified" = false;
