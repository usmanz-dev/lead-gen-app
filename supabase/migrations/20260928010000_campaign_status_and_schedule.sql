-- The Campaigns List page (leadgen.md's outreach pipeline) needs a richer
-- lifecycle than the original 4 states: "scheduled" (a real, user-set
-- send time — see scheduled_at below) and "sending" (renamed from
-- "active", which was ambiguous outreach terminology). No automatic
-- worker drives these transitions yet (there's no bulk-send pipeline
-- built), so today they're only ever set by explicit user action — same
-- honest-but-manual status the app already uses elsewhere (e.g. lead
-- status) ahead of full automation.
alter table public.campaigns drop constraint campaigns_status_check;
alter table public.campaigns add constraint campaigns_status_check
  check (status in ('draft', 'scheduled', 'sending', 'paused', 'completed'));

alter table public.campaigns add column scheduled_at timestamptz;
