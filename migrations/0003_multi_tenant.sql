-- Multi-tenant: every client institution is an organisation with its own
-- campuses, people, courses, submissions, audit trail and API clients.
-- Innovo staff are platform admins who register organisations.

create table if not exists organizations (
  id text primary key,
  name text not null,
  short_name text not null,
  join_code text not null unique,
  email_domains text not null default '',
  admin_emails text not null default '',
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists campuses (
  id text primary key,
  org_id text not null references organizations(id) on delete cascade,
  name text not null,
  detail text,
  created_at timestamptz not null default now()
);

alter table profiles add column if not exists org_id text;
alter table profiles add column if not exists is_platform_admin boolean not null default false;
alter table profiles alter column campus drop not null;

alter table courses add column if not exists org_id text;
alter table courses alter column campus drop not null;

alter table submissions add column if not exists org_id text;
alter table audit_log add column if not exists org_id text;
alter table api_clients add column if not exists org_id text;
-- corpus.org_id null = shared library visible to every organisation
alter table corpus add column if not exists org_id text;

create index if not exists campuses_org_idx on campuses (org_id);
create index if not exists profiles_org_idx on profiles (org_id);
create index if not exists courses_org_idx on courses (org_id);
create index if not exists submissions_org_idx on submissions (org_id);
create index if not exists audit_org_idx on audit_log (org_id);
create index if not exists api_clients_org_idx on api_clients (org_id);
create index if not exists corpus_org_idx on corpus (org_id);

-- Existing single-client deployments: keep their users and work in one neutral
-- organisation so nothing is lost. Fresh databases skip this (no profiles yet).
insert into organizations (id, name, short_name, join_code)
select 'legacy', 'Existing users', 'Existing', upper(substr(md5(random()::text), 1, 8))
where exists (select 1 from profiles)
on conflict (id) do nothing;

update profiles set org_id = 'legacy', campus = null
  where org_id is null and exists (select 1 from organizations where id = 'legacy');
update courses set org_id = 'legacy', campus = null
  where org_id is null and exists (select 1 from organizations where id = 'legacy');
update submissions set org_id = 'legacy'
  where org_id is null and exists (select 1 from organizations where id = 'legacy');
update audit_log set org_id = 'legacy'
  where org_id is null and exists (select 1 from organizations where id = 'legacy');
update api_clients set org_id = 'legacy'
  where org_id is null and exists (select 1 from organizations where id = 'legacy');

-- Existing administrators become platform admins (Innovo staff).
update profiles set is_platform_admin = true where role = 'admin';

-- The old seeded demo courses belonged to a single former client; remove them.
update submissions set assignment_id = null
  where assignment_id in (select a.id from assignments a join courses c on c.id = a.course_id
                          where c.owner_user_id = 'institution');
delete from courses where owner_user_id = 'institution';
