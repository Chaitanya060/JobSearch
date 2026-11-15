-- JobPilot initial schema (Functional Upgrade spec §5). Forward-only; no data drops.
-- Firebase UID is TEXT (not a UUID). Internal ids are UUID.
-- Apply via the Supabase SQL editor (dev project first).

create extension if not exists pgcrypto;

-- A. profiles
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text unique not null,
  email text,
  full_name text,
  phone text,
  photo_url text,
  country text,
  city text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  education_level text,
  degree text,
  specialization text,
  college_name text,
  graduation_year integer,
  experience_level text,
  onboarding_completed boolean not null default false,
  profile_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- B. user_skills (case-insensitive uniqueness per user)
create table if not exists user_skills (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null,
  skill_name text not null,
  proficiency text check (proficiency in ('beginner','intermediate','advanced')),
  created_at timestamptz not null default now()
);
create unique index if not exists user_skills_uid_name_uq
  on user_skills (firebase_uid, lower(skill_name));

-- C. work_experience
create table if not exists work_experience (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null,
  company_name text not null,
  job_title text not null,
  employment_type text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  responsibilities text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_exp_current_dates check (not (is_current and end_date is not null))
);

-- D. user_preferences
create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text unique not null,
  target_roles text[] not null default '{}',
  preferred_locations text[] not null default '{}',
  employment_types text[] not null default '{}',
  work_arrangements text[] not null default '{}',
  experience_preference text,
  minimum_salary numeric,
  maximum_salary numeric,
  currency text default 'INR',
  updated_at timestamptz not null default now(),
  constraint prefs_salary_range check (
    minimum_salary is null or maximum_salary is null or minimum_salary <= maximum_salary
  )
);

-- E. resumes (metadata only; bytes live in R2)
create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null,
  original_filename text not null,
  object_key text unique not null,
  file_size_bytes bigint not null,
  mime_type text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists resumes_uid_idx on resumes (firebase_uid);

-- F. job_sources
create table if not exists job_sources (
  id uuid primary key default gen_random_uuid(),
  provider_name text not null,
  provider_key text unique not null,
  provider_type text not null,
  enabled boolean not null default true,
  attribution_text text,
  terms_url text,
  last_successful_run timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- G. jobs
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references job_sources(id),
  provider_key text not null,
  external_job_id text not null,
  title text not null,
  company_name text not null,
  description text,
  location text,
  country text,
  employment_type text,
  work_arrangement text,
  experience_level text,
  skills text[] not null default '{}',
  salary_min numeric,
  salary_max numeric,
  currency text,
  application_url text not null,
  source_url text,
  posted_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','possibly_expired','closed','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_key, external_job_id)
);
create index if not exists jobs_status_posted_idx on jobs (status, posted_at desc);
create index if not exists jobs_location_idx on jobs (location);
create index if not exists jobs_company_idx on jobs (company_name);

-- H. saved_jobs
create table if not exists saved_jobs (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null,
  job_id uuid not null references jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (firebase_uid, job_id)
);
create index if not exists saved_jobs_uid_idx on saved_jobs (firebase_uid);

-- I. applications
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null,
  job_id uuid not null references jobs(id),
  status text not null default 'interested'
    check (status in ('interested','preparing','applied','assessment','interview','offer','rejected','withdrawn')),
  application_method text,
  applied_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firebase_uid, job_id)
);
create index if not exists applications_uid_updated_idx on applications (firebase_uid, updated_at desc);

-- J. application_events
create table if not exists application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  firebase_uid text not null,
  event_type text not null,
  description text,
  created_at timestamptz not null default now()
);

-- K. ingestion_runs
create table if not exists ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fetched_count integer not null default 0,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  skipped_count integer not null default 0,
  error_count integer not null default 0,
  status text not null default 'running' check (status in ('running','success','partial','failed')),
  error_message text
);
create index if not exists ingestion_runs_provider_idx on ingestion_runs (provider_key, started_at desc);

-- L. admin_users
create table if not exists admin_users (
  firebase_uid text primary key,
  role text not null check (role in ('admin','superadmin')),
  created_at timestamptz not null default now()
);

-- RLS as defense-in-depth. The Worker uses the Supabase SECRET key, which bypasses
-- RLS, so route-level ownership checks by verified uid remain mandatory (spec §5 security).
alter table profiles          enable row level security;
alter table user_skills       enable row level security;
alter table work_experience   enable row level security;
alter table user_preferences  enable row level security;
alter table resumes           enable row level security;
alter table saved_jobs        enable row level security;
alter table applications      enable row level security;
alter table application_events enable row level security;
alter table admin_users       enable row level security;
-- No permissive policies are created: with RLS on and no policy, only the
-- service/secret key (the Worker) can read/write. The anon key cannot.
