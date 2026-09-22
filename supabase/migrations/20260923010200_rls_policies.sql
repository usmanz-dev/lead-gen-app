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
