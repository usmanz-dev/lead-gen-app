-- Combined migration for one-time paste into Supabase SQL Editor.
-- Source of truth is supabase/migrations/*.sql (run in order below).
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

-- Tracks whether an organization has finished the onboarding flow, so the
-- login page can route back into onboarding instead of the dashboard.
alter table public.organizations
  add column onboarding_completed boolean not null default false;

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

-- Blog posts — platform-wide editorial content, not organization-scoped
-- tenant data, so this table sits outside the get_user_org_ids() pattern
-- used everywhere else. Anyone (including anonymous visitors) can read
-- published posts; there's no client-facing write path yet (no admin
-- panel — see leadgen.md's build order), so new posts are added via the
-- Supabase dashboard or SQL, which is what "no code changes" means here.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content text not null,
  category text not null,
  author_name text not null default 'LocalLeads AI Team',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_status_published_at_idx on public.posts (status, published_at desc);
create index posts_category_idx on public.posts (category);

create trigger set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

create policy "anyone can read published posts"
  on public.posts for select
  to anon, authenticated
  using (status = 'published');

-- Seed content so the blog is demonstrable end to end, and so pagination
-- and category filtering have something real to work against. These are
-- genuine posts, not lorem ipsum — delete or edit them freely via the
-- dashboard once real content exists.

insert into public.posts (slug, title, excerpt, content, category, published_at, status)
values
(
  'how-the-opportunity-score-actually-works',
  'How the Opportunity Score Actually Works',
  'A 0-100 number is only useful if you trust what''s behind it. Here''s exactly how LocalLeads AI decides which businesses need you most.',
  $md$Every lead LocalLeads AI finds gets scored from 0 to 100 the moment it's discovered. The number itself isn't the point — the breakdown behind it is. This post walks through exactly how that score is built, so you know precisely why a lead landed where it did.

## Why a single score at all

Before the Opportunity Score existed, evaluating a lead meant opening five browser tabs: the Google Maps listing, the business's website (if it had one), a manual mobile-friendliness check, an SSL check, and a guess about how active the business looked on social media. That's fine for one lead. It falls apart at fifty.

The score compresses all of that into one weighted number, with the reasoning still fully visible underneath it. You're never trusting a black box — you're trusting arithmetic you can read.

## The signals that make up the score

### No website

The single heaviest signal. A local business with zero web presence is almost always losing customers to competitors who show up in search. This contributes the largest share of the score.

### Review count and rating

Businesses with very few reviews, or a rating that's dragging (generally under 4.0), are visibly under-marketed. Both low review count and low rating are scored independently, because they mean different things — a 4.8 rating with six reviews is a different problem than a 3.2 rating with two hundred.

### Missing business hours

Sounds minor. It isn't. A Google Maps listing without hours is a common sign of a profile nobody has touched since it was created, which usually means nobody's actively managing the business's online presence at all.

### No social presence

If a search for the business turns up no active Facebook, Instagram, or LinkedIn, that's one more data point toward "nobody here is thinking about marketing right now" — which is exactly the kind of business that responds well to an outside pitch.

### Website quality, when a website exists

If the business does have a website, two more checks kick in: whether it's reasonably mobile-friendly, and whether it has a valid SSL certificate. A business with an outdated, non-secure website is a different (and often easier) sell than a business with no website at all — different pitch, same underlying opportunity.

## Reading the score bands

- **70-100 (High):** Multiple strong signals stacked together. These are usually the fastest closes.
- **40-69 (Medium):** A mix of gaps and strengths. Worth pursuing, but the pitch needs to be more targeted.
- **0-39 (Low):** The business already has most of the fundamentals in place. Not necessarily a bad lead — sometimes it means a different kind of pitch (rank tracking, ongoing management) rather than "you need a website."

## Using the breakdown, not just the number

Every lead's score page shows the full list of contributing factors, not just the total. That breakdown is what actually goes into your outreach — an email that says "I noticed your business doesn't show up with a working website" is a very different email than a generic "we do SEO" pitch, and it converts differently too.

The score exists to save you time deciding *who* to contact. The breakdown exists to help you decide *what to say* once you do.
$md$,
  'Local SEO',
  now() - interval '2 days',
  'published'
),
(
  '5-signs-a-local-business-is-ready-to-buy-seo',
  '5 Signs a Local Business Is Ready to Buy SEO Services',
  'Not every low-scoring lead is worth the same pitch. These are the patterns worth paying attention to before you write the first email.',
  $md$The Opportunity Score gets you most of the way to "who's worth contacting." These five patterns help you go further — they're less about whether a business needs help, and more about whether they're likely to actually say yes when you offer it.

## 1. They've clearly tried something, once

A business with an abandoned Facebook page from three years ago, or a website that hasn't been updated since it was built, has already decided marketing matters — they just didn't follow through. That's a much warmer starting point than a business that's never tried anything at all, because you're not convincing them marketing works. You're convincing them it's worth trying again, with someone who'll actually follow through.

## 2. A competitor nearby is visibly winning

If you pull up the map pack for their exact keyword and a direct competitor sits in position one while they're nowhere to be found, that's not an abstract pitch — it's a screenshot. Nothing sells local SEO faster than showing someone exactly who's eating their lunch.

## 3. They're clearly busy, but not visible

Good review volume, decent rating, obviously a real, functioning business — just invisible online. This is often the easiest yes of all, because you're not pitching them on "is my business good enough to market." You're pitching a business that already knows it's good and just hasn't gotten around to being found.

## 4. Recent negative reviews with no response

A business that isn't responding to reviews — good or bad — is a business nobody is managing online. That's an opening for more than SEO: reputation management is an easy add-on once you're already in the door.

## 5. They're a newer business (under 2 years)

Newer businesses are still forming their habits around where money goes. They haven't settled into "we don't do that" the way an established business with fifteen years of doing things the old way sometimes has.

None of these replace the Opportunity Score — they layer on top of it. The score tells you who needs help. These patterns help you guess who's actually going to pick up the phone.
$md$,
  'Local SEO',
  now() - interval '9 days',
  'published'
),
(
  'why-generic-cold-emails-dont-work',
  'Why Generic Cold Emails Don''t Work (And What Does)',
  'The reply rate difference between a templated pitch and a specific one isn''t small. Here''s what actually changes when an email references something real.',
  $md$If you've ever sent a batch of cold emails that all say some version of "we help businesses grow with SEO," you already know the reply rate. It's close to zero, and it should be — that email could have been sent to literally any business on earth.

## The problem isn't cold email. It's generic email.

Cold outreach works. Fifteen years of SaaS and agency growth is built on it. What doesn't work is outreach that could apply to anyone, because the moment a reader senses a template, the message becomes background noise — the same category as a phishing attempt or a spam offer, mentally filed and deleted in under two seconds.

## What "specific" actually means

Specific doesn't mean "uses their first name." Mail-merge solved that problem decades ago and it didn't move the needle, because a name swap is still obviously automated once you read the second sentence.

Specific means the email demonstrates you looked at *this* business, not just found it in a list:

- "I noticed your Google Maps listing doesn't have a website linked" — references something true and checkable.
- "Your competitor two blocks over is ranking above you for [keyword]" — shows research, not a template.
- "Your last few reviews mention slow response times" — shows you actually looked, not just scraped.

This is exactly why LocalLeads AI's AI Outreach Generator writes from the lead's actual Opportunity Score breakdown instead of a fill-in-the-blank template — the email is different for every lead because the reasons are different for every lead.

## Length matters more than people think

Long cold emails ask for more attention than a stranger owes you. Every draft should be short enough to read in the time it takes to open it — under 150 words is a good ceiling. If your pitch needs three paragraphs to make its case, the first message isn't the place to make the full case. It's the place to earn a reply.

## The CTA should ask for almost nothing

"Let's hop on a 30-minute call" is a big ask from someone who doesn't know you yet. "Worth a quick reply if this is relevant?" costs the reader ten seconds. Lower the bar on the first message; you can ask for more once they've responded once.

## Compliance isn't optional, and it isn't just legal cover

Every outreach email should include a working unsubscribe link and clear sender identification, full stop — not just because CAN-SPAM and similar laws require it, but because a business that can't tell who's emailing them, or can't opt out, reports the email instead of ignoring it. That's worse for deliverability than a low reply rate ever will be.

Personalized, short, low-friction, compliant. That combination is the entire difference between a cold email that gets deleted and one that gets a reply.
$md$,
  'Cold Outreach',
  now() - interval '16 days',
  'published'
),
(
  'announcing-localleads-ai',
  'Announcing LocalLeads AI: Find, Qualify, and Close Local Clients in One Platform',
  'Why we built one platform instead of another point solution, and what it replaces.',
  $md$Today we're opening up LocalLeads AI: a single platform that finds local businesses that need SEO help, tells you exactly why they need it, verifies how to reach them, and drafts the outreach — automatically.

## The problem we kept running into

Running local SEO for clients meant juggling three or four separate tools just to find the *next* client: a scraper or manual Google Maps search for leads, a separate email-finding tool, a separate validator so campaigns didn't bounce, and a separate AI writing tool (or no AI at all) for the actual outreach. None of those tools talked to each other, and switching between them was where most of the actual time went — not the strategy, the plumbing.

## What's live today

- **Lead Extraction** — search any niche and location, get every matching business from Google Maps in seconds.
- **Opportunity Score** — every lead scored 0-100 with a full, visible breakdown of why.
- **Email Finder & Validator** — every email classified Valid, Risky, Invalid, or Unknown before you ever send to it.
- **AI Outreach Generator** — a short, specific email per lead, written from that lead's actual score breakdown.
- **Rank Tracker** — grid-based Google Maps rank tracking to prove results, or scope a competitor.
- **White-Label Reports** — a branded PDF audit, one click away, for any lead.

## What's next

Team collaboration, a full CRM pipeline, and deeper campaign analytics are all in progress. If there's something specific slowing down your prospecting that isn't listed here, [tell us](/about) — that's exactly the kind of feedback that shapes what gets built next.

Thanks for reading this far. Go run your first search.
$md$,
  'Product Updates',
  now() - interval '23 days',
  'published'
);


-- Lead Detail view (leadgen.md's CRM-lite pipeline) needs two things the
-- original schema didn't have: multiple timestamped, individually
-- editable/deletable notes per lead (leads.notes was a single freeform
-- column — left in place, but superseded by this table going forward),
-- and a real activity timeline rather than a derived/fake one.

-- ---------------------------------------------------------------------------
-- lead_notes
-- ---------------------------------------------------------------------------
create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid references public.users (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lead_notes_lead_id_idx on public.lead_notes (lead_id);

create trigger set_updated_at
  before update on public.lead_notes
  for each row execute function public.set_updated_at();

alter table public.lead_notes enable row level security;

create policy "members can manage their org's lead notes"
  on public.lead_notes for all
  to authenticated
  using (organization_id in (select public.get_user_org_ids()))
  with check (organization_id in (select public.get_user_org_ids()));

-- ---------------------------------------------------------------------------
-- lead_activity_events — every event tied to a lead, in order. Populated
-- by the app on status changes, note CRUD, email re-validation, and
-- campaign assignment, plus a DB trigger for lead creation (so a lead
-- scraped by the worker, which runs as the service role and bypasses
-- app-level logging, still gets a "created" entry).
-- ---------------------------------------------------------------------------
create table public.lead_activity_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references public.users (id) on delete set null,
  event_type text not null check (
    event_type in (
      'created', 'status_changed', 'note_added', 'note_updated',
      'note_deleted', 'email_validated', 'added_to_campaign'
    )
  ),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index lead_activity_events_lead_id_idx
  on public.lead_activity_events (lead_id, created_at desc);

alter table public.lead_activity_events enable row level security;

create policy "members can view their org's lead activity"
  on public.lead_activity_events for select
  to authenticated
  using (organization_id in (select public.get_user_org_ids()));

create policy "members can log their org's lead activity"
  on public.lead_activity_events for insert
  to authenticated
  with check (organization_id in (select public.get_user_org_ids()));

-- The worker's service-role insert into public.leads needs a matching
-- service-role-only insert path into the activity log (the trigger below
-- runs as the table owner regardless of role, so this policy is only
-- exercised if something ever logs activity directly as service_role).
create policy "service role can log lead activity"
  on public.lead_activity_events for insert
  to service_role
  with check (true);

create or replace function public.log_lead_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.lead_activity_events (lead_id, organization_id, event_type, message)
  values (new.id, new.organization_id, 'created', 'Lead created');
  return new;
end;
$$;

create trigger log_lead_created
  after insert on public.leads
  for each row execute function public.log_lead_created();
