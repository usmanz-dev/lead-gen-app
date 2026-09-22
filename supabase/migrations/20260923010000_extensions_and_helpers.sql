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
