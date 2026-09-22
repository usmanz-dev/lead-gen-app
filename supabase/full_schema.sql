-- Combined migration for one-time paste into Supabase SQL Editor.
-- Source of truth is supabase/migrations/*.sql (4 files, run in order below).
-- Safe to delete this file after running it once.

-- Extensions
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- updated_at helper: every table gets a BEFORE UPDATE trigger using this.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS helpers.
--
-- These are SECURITY DEFINER so they bypass RLS on team_members internally
-- when computing membership — this is what avoids infinite recursion when a
-- policy on team_members itself needs to check team_members. See:
-- https://supabase.com/docs/guides/database/postgres/row-level-security#use-security-definer-functions
-- ---------------------------------------------------------------------------

-- All organization_ids the current JWT's user belongs to.
create or replace function public.get_user_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id
  from public.team_members
  where user_id = auth.uid();
$$;

-- Whether the current user is an admin of a specific organization.
create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members
    where organization_id = org_id
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.get_user_org_ids() to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;

-- =============================================================================
-- LocalLeads AI — core schema
-- Table order follows FK dependency order. See leadgen.md §9 for the summary
-- this expands on.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- organizations — the tenant. Every other table hangs off organization_id.
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- users — app-facing profile, 1:1 with an auth.users row. Populated by the
-- handle_new_user trigger (see the auth_trigger migration), not by the app.
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Now that public.users exists, point organizations.owner_id at it.
alter table public.organizations
  add constraint organizations_owner_id_fkey
  foreign key (owner_id) references public.users (id) on delete set null,
  alter column owner_id set default auth.uid();

-- ---------------------------------------------------------------------------
-- team_members — join table between users and organizations, carries role.
-- ---------------------------------------------------------------------------
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index team_members_organization_id_idx on public.team_members (organization_id);
create index team_members_user_id_idx on public.team_members (user_id);

create trigger set_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

-- Auto-add the creator of an organization as its first admin.
create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_members (organization_id, user_id, role)
  values (new.id, coalesce(new.owner_id, auth.uid()), 'admin')
  on conflict (organization_id, user_id) do nothing;
  return new;
end;
$$;

create trigger on_organization_created
  after insert on public.organizations
  for each row execute function public.handle_new_organization();

-- ---------------------------------------------------------------------------
-- subscriptions — one per organization. Stripe-billed; see leadgen.md §7/§13.
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  plan text not null default 'starter' check (plan in ('starter', 'growth', 'pro', 'agency')),
  status text not null default 'trialing' check (
    status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')
  ),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  leads_limit integer not null default 500,
  emails_limit integer not null default 500,
  leads_used_this_cycle integer not null default 0,
  emails_used_this_cycle integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id);

create trigger set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sender_accounts — connected mailboxes used to send campaigns.
-- Referenced by campaigns below, so it's created first.
-- ---------------------------------------------------------------------------
create table public.sender_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email_address text not null,
  provider text not null default 'smtp' check (provider in ('gmail', 'smtp')),
  -- Encrypted at the application layer before being written here (e.g. via
  -- Supabase Vault or app-level AES-GCM) — never store plaintext SMTP
  -- passwords / OAuth refresh tokens.
  encrypted_credentials text,
  warmup_status text not null default 'not_started' check (
    warmup_status in ('not_started', 'warming_up', 'completed')
  ),
  daily_send_count integer not null default 0,
  daily_send_limit integer not null default 50,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sender_accounts_organization_id_idx on public.sender_accounts (organization_id);

create trigger set_updated_at
  before update on public.sender_accounts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- searches — one Lead Search run (keyword + location + filters).
-- ---------------------------------------------------------------------------
create table public.searches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid references public.users (id) on delete set null,
  keyword text not null,
  location text not null,
  filters jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (
    status in ('pending', 'running', 'completed', 'failed')
  ),
  error_message text,
  leads_found integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index searches_organization_id_idx on public.searches (organization_id);
create index searches_created_by_idx on public.searches (created_by);
create index searches_status_idx on public.searches (status);

create trigger set_updated_at
  before update on public.searches
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- leads — the core lead record, scored with an Opportunity Score.
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  search_id uuid references public.searches (id) on delete set null,
  name text not null,
  category text,
  phone text,
  address text,
  rating numeric(2, 1) check (rating is null or (rating >= 0 and rating <= 5)),
  review_count integer not null default 0,
  website_url text,
  google_maps_url text,
  business_hours jsonb,
  email text,
  email_validation_status text not null default 'unknown' check (
    email_validation_status in ('valid', 'risky', 'invalid', 'unknown')
  ),
  social_links jsonb not null default '{}'::jsonb,
  opportunity_score smallint check (
    opportunity_score is null or (opportunity_score >= 0 and opportunity_score <= 100)
  ),
  opportunity_score_breakdown jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (
    status in ('new', 'contacted', 'interested', 'closed')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_organization_id_idx on public.leads (organization_id);
create index leads_search_id_idx on public.leads (search_id);
create index leads_status_idx on public.leads (status);
create index leads_opportunity_score_idx on public.leads (opportunity_score desc nulls last);
create index leads_email_idx on public.leads (email);

create trigger set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- campaigns — a batch of outreach against a set of leads.
-- ---------------------------------------------------------------------------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid references public.users (id) on delete set null,
  sender_account_id uuid references public.sender_accounts (id) on delete set null,
  name text not null,
  status text not null default 'draft' check (
    status in ('draft', 'active', 'paused', 'completed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campaigns_organization_id_idx on public.campaigns (organization_id);
create index campaigns_sender_account_id_idx on public.campaigns (sender_account_id);
create index campaigns_status_idx on public.campaigns (status);

create trigger set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- campaign_leads — join table: which leads are in a campaign, and where
-- each one is in the send lifecycle.
-- ---------------------------------------------------------------------------
create table public.campaign_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  email_status text not null default 'queued' check (
    email_status in (
      'queued', 'sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed'
    )
  ),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  bounced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, lead_id)
);

create index campaign_leads_campaign_id_idx on public.campaign_leads (campaign_id);
create index campaign_leads_lead_id_idx on public.campaign_leads (lead_id);
create index campaign_leads_email_status_idx on public.campaign_leads (email_status);

create trigger set_updated_at
  before update on public.campaign_leads
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- generated_emails — the AI (or manually written) email copy per lead.
-- ---------------------------------------------------------------------------
create table public.generated_emails (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  subject text not null,
  body text not null,
  ai_generated boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index generated_emails_campaign_id_idx on public.generated_emails (campaign_id);
create index generated_emails_lead_id_idx on public.generated_emails (lead_id);

create trigger set_updated_at
  before update on public.generated_emails
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- rank_tracker_jobs — grid-based Google Maps rank tracking for a keyword.
-- Not tied to a specific lead: an agency may track its own client's
-- business, which need not exist in the leads table.
-- ---------------------------------------------------------------------------
create table public.rank_tracker_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  business_name text not null,
  google_maps_url text,
  keyword text not null,
  grid_points jsonb not null default '[]'::jsonb,
  schedule text not null default 'weekly' check (
    schedule in ('daily', 'weekly', 'biweekly', 'monthly')
  ),
  results_history jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rank_tracker_jobs_organization_id_idx on public.rank_tracker_jobs (organization_id);

create trigger set_updated_at
  before update on public.rank_tracker_jobs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- reports — generated, optionally white-labeled PDF audits per lead.
-- ---------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  created_by uuid references public.users (id) on delete set null,
  pdf_url text not null,
  branding_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reports_organization_id_idx on public.reports (organization_id);
create index reports_lead_id_idx on public.reports (lead_id);

create trigger set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- unsubscribes — per-organization suppression list, checked before every
-- send. Scoped to the organization (the sender), not global across
-- unrelated tenants: a contact opting out of Agency A's emails has no
-- bearing on Agency B independently emailing the same address.
-- ---------------------------------------------------------------------------
create table public.unsubscribes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  email text not null,
  unsubscribed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email)
);

create index unsubscribes_organization_id_idx on public.unsubscribes (organization_id);
create index unsubscribes_email_idx on public.unsubscribes (email);

create trigger set_updated_at
  before update on public.unsubscribes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- usage_logs — per user, per feature, per month counters for fair-use /
-- plan-limit enforcement (leadgen.md §14).
-- ---------------------------------------------------------------------------
create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  feature text not null,
  period_month date not null,
  count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, feature, period_month)
);

create index usage_logs_organization_id_period_idx on public.usage_logs (organization_id, period_month);
create index usage_logs_user_id_idx on public.usage_logs (user_id);

create trigger set_updated_at
  before update on public.usage_logs
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Row-Level Security — every table is scoped to organizations the
-- authenticated user belongs to, via public.get_user_org_ids().
-- The service_role key (used by backend workers) bypasses RLS entirely, per
-- Supabase's standard behavior — these policies only govern access made
-- with a user's own JWT (the anon/authenticated roles).
--
-- Where a table's read and write access share the exact same condition
-- ("any org member"), a single `for all` policy covers both — a separate
-- `for select` policy would just be a redundant, identically-scoped OR.
-- Tables that split read vs. write access by role (organizations, users,
-- team_members, subscriptions) get explicit per-command policies instead.
-- =============================================================================

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.team_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.sender_accounts enable row level security;
alter table public.searches enable row level security;
alter table public.leads enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_leads enable row level security;
alter table public.generated_emails enable row level security;
alter table public.rank_tracker_jobs enable row level security;
alter table public.reports enable row level security;
alter table public.unsubscribes enable row level security;
alter table public.usage_logs enable row level security;

-- ---------------------------------------------------------------------------
-- organizations — members can view; only admins update/delete; any
-- authenticated user can create one (they become its owner + first admin
-- via the handle_new_organization trigger).
-- ---------------------------------------------------------------------------
create policy "members can view their organizations"
  on public.organizations for select
  to authenticated
  using (id in (select public.get_user_org_ids()));

create policy "authenticated users can create an organization"
  on public.organizations for insert
  to authenticated
  with check (owner_id is null or owner_id = auth.uid());

create policy "admins can update their organization"
  on public.organizations for update
  to authenticated
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

create policy "admins can delete their organization"
  on public.organizations for delete
  to authenticated
  using (public.is_org_admin(id));

-- ---------------------------------------------------------------------------
-- users — a user always sees/edits their own profile, and can see the
-- profiles of people they share an organization with (for team UI). Row
-- creation is handled by the handle_new_user trigger, not client inserts.
-- ---------------------------------------------------------------------------
create policy "users can view own profile"
  on public.users for select
  to authenticated
  using (id = auth.uid());

create policy "users can view org teammates' profiles"
  on public.users for select
  to authenticated
  using (
    id in (
      select tm.user_id
      from public.team_members tm
      where tm.organization_id in (select public.get_user_org_ids())
    )
  );

create policy "users can update own profile"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- team_members — every member can see their org's team; only admins can
-- add, change roles, or remove members.
-- ---------------------------------------------------------------------------
create policy "members can view their org's team"
  on public.team_members for select
  to authenticated
  using (organization_id in (select public.get_user_org_ids()));

create policy "admins can add team members"
  on public.team_members for insert
  to authenticated
  with check (public.is_org_admin(organization_id));

create policy "admins can update team members"
  on public.team_members for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "admins can remove team members"
  on public.team_members for delete
  to authenticated
  using (public.is_org_admin(organization_id));

-- ---------------------------------------------------------------------------
-- subscriptions — every member can view billing status; only admins change
-- it via the client. In practice, writes mostly happen via the Stripe
-- webhook handler using the service_role key, which bypasses RLS.
-- ---------------------------------------------------------------------------
create policy "members can view their subscription"
  on public.subscriptions for select
  to authenticated
  using (organization_id in (select public.get_user_org_ids()));

create policy "admins can manage their subscription"
  on public.subscriptions for all
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

-- ---------------------------------------------------------------------------
-- sender_accounts, searches, leads, campaigns, rank_tracker_jobs, reports,
-- unsubscribes — any org member can read and manage. One `for all` policy
-- per table.
-- ---------------------------------------------------------------------------
create policy "members can manage their org's sender accounts"
  on public.sender_accounts for all
  to authenticated
  using (organization_id in (select public.get_user_org_ids()))
  with check (organization_id in (select public.get_user_org_ids()));

create policy "members can manage their org's searches"
  on public.searches for all
  to authenticated
  using (organization_id in (select public.get_user_org_ids()))
  with check (organization_id in (select public.get_user_org_ids()));

create policy "members can manage their org's leads"
  on public.leads for all
  to authenticated
  using (organization_id in (select public.get_user_org_ids()))
  with check (organization_id in (select public.get_user_org_ids()));

create policy "members can manage their org's campaigns"
  on public.campaigns for all
  to authenticated
  using (organization_id in (select public.get_user_org_ids()))
  with check (organization_id in (select public.get_user_org_ids()));

create policy "members can manage their org's rank tracker jobs"
  on public.rank_tracker_jobs for all
  to authenticated
  using (organization_id in (select public.get_user_org_ids()))
  with check (organization_id in (select public.get_user_org_ids()));

create policy "members can manage their org's reports"
  on public.reports for all
  to authenticated
  using (organization_id in (select public.get_user_org_ids()))
  with check (organization_id in (select public.get_user_org_ids()));

create policy "members can manage their org's unsubscribe list"
  on public.unsubscribes for all
  to authenticated
  using (organization_id in (select public.get_user_org_ids()))
  with check (organization_id in (select public.get_user_org_ids()));

-- ---------------------------------------------------------------------------
-- campaign_leads, generated_emails — no organization_id column of their
-- own; scoped indirectly through the parent campaign's organization.
-- ---------------------------------------------------------------------------
create policy "members can manage their org's campaign leads"
  on public.campaign_leads for all
  to authenticated
  using (
    campaign_id in (
      select id from public.campaigns
      where organization_id in (select public.get_user_org_ids())
    )
  )
  with check (
    campaign_id in (
      select id from public.campaigns
      where organization_id in (select public.get_user_org_ids())
    )
  );

create policy "members can manage their org's generated emails"
  on public.generated_emails for all
  to authenticated
  using (
    campaign_id in (
      select id from public.campaigns
      where organization_id in (select public.get_user_org_ids())
    )
  )
  with check (
    campaign_id in (
      select id from public.campaigns
      where organization_id in (select public.get_user_org_ids())
    )
  );

-- ---------------------------------------------------------------------------
-- usage_logs — read-only from the client; writes come from the
-- service_role key (usage is recorded server-side, not self-reported).
-- ---------------------------------------------------------------------------
create policy "members can view their org's usage logs"
  on public.usage_logs for select
  to authenticated
  using (organization_id in (select public.get_user_org_ids()));

-- =============================================================================
-- Bridges Supabase Auth to the app's public.users profile table: every new
-- auth.users row (email/password signup, Google OAuth, etc.) gets a
-- matching public.users row automatically.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep public.users.email in sync if it ever changes in auth.users.
create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.users set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update on auth.users
  for each row execute function public.handle_user_email_update();
