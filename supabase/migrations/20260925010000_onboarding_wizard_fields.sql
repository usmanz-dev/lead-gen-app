-- Fields collected by the onboarding wizard (app/onboarding), plus a
-- resume pointer so a user who leaves partway through picks up where they
-- left off instead of restarting.
alter table public.organizations
  add column business_type text check (
    business_type is null or business_type in ('freelancer', 'agency', 'in_house_team', 'other')
  ),
  add column target_industries text[] not null default '{}',
  add column target_locations text[] not null default '{}',
  add column onboarding_step smallint not null default 0;
