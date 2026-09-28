-- Sender Settings needs a real warm-up ramp (a sender's *effective* daily
-- limit climbs over its first ~2 weeks rather than jumping straight to
-- daily_send_limit) and an enable/disable toggle for that ramp. The ramp
-- schedule itself lives in lib/sender-warmup.ts, computed from these two
-- columns — nothing here is a display-only decoration.
alter table public.sender_accounts add column warmup_enabled boolean not null default true;

alter table public.sender_accounts add column warmup_started_at timestamptz;
update public.sender_accounts set warmup_started_at = created_at where warmup_started_at is null;
alter table public.sender_accounts alter column warmup_started_at set not null;
alter table public.sender_accounts alter column warmup_started_at set default now();
