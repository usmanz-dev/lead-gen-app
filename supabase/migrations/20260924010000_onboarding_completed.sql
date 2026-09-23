-- Tracks whether an organization has finished the onboarding flow, so the
-- login page can route back into onboarding instead of the dashboard.
alter table public.organizations
  add column onboarding_completed boolean not null default false;
