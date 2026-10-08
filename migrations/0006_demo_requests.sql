-- Demo requests from the public homepage. Only platform admins can read them.
create table if not exists demo_requests (
  id text primary key,
  name text not null,
  email text not null,
  institution text not null,
  role text,
  phone text,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists demo_requests_created_idx on demo_requests (created_at desc);
