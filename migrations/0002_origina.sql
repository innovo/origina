create table if not exists profiles (
  user_id text primary key,
  full_name text not null,
  role text not null check (role in ('student', 'teacher', 'admin')),
  campus text not null,
  student_number text,
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id text primary key,
  code text not null,
  title text not null,
  campus text not null,
  owner_user_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists assignments (
  id text primary key,
  course_id text not null references courses(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists submissions (
  id text primary key,
  user_id text not null,
  assignment_id text,
  title text not null,
  filename text not null,
  extracted_text text not null,
  language text,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id text primary key,
  submission_id text not null references submissions(id) on delete cascade,
  similarity_pct integer not null,
  ai_pct integer,
  findings_json text not null,
  created_at timestamptz not null default now()
);

create table if not exists corpus (
  id text primary key,
  title text not null,
  source_type text not null,
  source_ref text,
  body text not null
);

create table if not exists audit_log (
  id text primary key,
  actor_user_id text not null,
  action text not null,
  entity_type text,
  entity_id text,
  detail text,
  created_at timestamptz not null default now()
);

create table if not exists api_clients (
  id text primary key,
  user_id text not null,
  name text not null,
  key_prefix text not null,
  created_at timestamptz not null default now()
);

create index if not exists submissions_user_id_idx on submissions (user_id);
create index if not exists submissions_created_idx on submissions (created_at desc);
create index if not exists reports_submission_id_idx on reports (submission_id);
create index if not exists audit_actor_idx on audit_log (actor_user_id);
create index if not exists courses_owner_idx on courses (owner_user_id);
