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
