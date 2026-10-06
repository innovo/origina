-- Working REST API keys (hashed) and stored academic judgements.

alter table api_clients add column if not exists key_hash text;
alter table api_clients add column if not exists revoked_at timestamptz;
create unique index if not exists api_clients_key_hash_idx on api_clients (key_hash);

-- Submissions made through the API have no Origina profile; keep the name sent.
alter table submissions add column if not exists author_name text;

create table if not exists judgements (
  id text primary key,
  org_id text not null,
  report_id text not null references reports(id) on delete cascade,
  user_id text not null,
  decision text not null check (decision in ('clear', 'discuss', 'refer')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists judgements_report_idx on judgements (report_id, created_at desc);
create index if not exists judgements_org_idx on judgements (org_id);
