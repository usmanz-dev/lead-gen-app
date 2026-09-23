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
