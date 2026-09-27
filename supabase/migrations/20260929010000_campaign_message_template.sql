-- The Campaign Builder's Compose step needs somewhere to store the
-- (optionally AI-generated) template with merge variables, and the
-- Review step's "skip invalid/unvalidated emails unless overridden" rule
-- needs a real, persisted choice rather than a one-off in-memory flag —
-- Launch Campaign reads it when deciding which leads become
-- campaign_leads rows, and it stays on the record for anyone auditing
-- why a particular lead was or wasn't emailed.
alter table public.campaigns add column email_subject text;
alter table public.campaigns add column email_body text;
alter table public.campaigns add column include_unvalidated_emails boolean not null default false;
