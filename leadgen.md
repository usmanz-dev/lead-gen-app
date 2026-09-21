# LocalLeads AI — Project Overview

> **Read this file first, before working on any page or feature.** It explains what this
> product is, who it's for, how it works end-to-end, and how all the pieces fit together.
> Treat this as the single source of truth for product intent — if a later prompt seems
> ambiguous, resolve it using the context in this file.

---

## 1. What This Product Is

**LocalLeads AI** (working name — rename as needed) is a SaaS platform for digital
marketing agencies, SEO consultants, and freelancers who sell local SEO / marketing
services to small businesses.

It solves three problems that are normally handled by 3-4 separate, disconnected tools:

1. **Finding potential clients** — local businesses that are likely to need SEO/marketing help.
2. **Verifying how to reach them** — finding and validating a real contact email.
3. **Actually reaching them** — writing and sending personalized cold outreach at scale.

Instead of an agency owner manually searching Google Maps, guessing which businesses look
"weak," finding emails by hand, and writing each cold email individually, this product
automates the entire pipeline from "search a niche + location" to "personalized emails
sent and tracked."

---

## 2. Who It's For

- Freelance SEO/marketing consultants
- Small-to-mid size digital marketing agencies
- Web design agencies who upsell SEO/marketing services
- Anyone doing local B2B lead generation and cold outreach

These users are **not necessarily technical** — the product must feel as polished and
easy to use as tools like Notion, Linear, or Stripe's own dashboard. No jargon, no
confusing steps, clear guidance at every point.

---

## 3. The Core Idea (One Sentence)

> "Search a niche + location → get a ranked list of local businesses that need help →
> know exactly why they need help → reach them automatically with a personalized email."

---

## 4. End-to-End User Flow (How It Actually Works)

This is the real journey a user takes through the product, step by step:

1. **Sign up** → completes a short onboarding wizard (business type, target industries,
   target locations, optionally connects a sending email).
2. **Runs a Lead Search** — types in a keyword/niche (e.g. "dentists") and a location
   (e.g. "Karachi"), optionally sets filters (minimum rating, has-website or not).
3. The system scrapes **Google Maps** for matching businesses (not the paid Places API —
   a self-hosted Playwright scraper, since this must run at zero fixed API cost). For each
   business found, if it has a website, the system also visits that website to look for an
   email address and social media links.
4. Every lead that comes in is automatically scored with an **Opportunity Score**
   (0-100) — a weighted point system based on: no website, low review count, low/no
   rating, missing business hours, no social presence, and (if a website exists) poor
   mobile-friendliness or no SSL. This tells the user, at a glance, which businesses are
   the best sales targets — the ones most obviously missing what this user sells.
5. Any email addresses found are automatically run through the **Email Validation
   Engine** (a self-built DNS + SMTP-level checker — no paid validation API) and tagged
   Valid / Risky / Invalid / Unknown.
6. The user reviews the **Leads List**, can filter/sort by Opportunity Score, review
   count, has-email, etc., and picks the leads worth pursuing.
7. The user builds a **Campaign**: selects leads (from the list, or by importing a
   list from a PDF/Excel/pasted text), describes their own service/offer in plain
   language, and the **AI Email Generator** (Claude API) writes a short, personalized,
   non-generic cold email per lead — referencing that specific lead's weaknesses
   naturally (e.g., mentioning their lack of a website).
8. The user connects (or has already connected) a **sending email account**
   (Gmail/Workspace OAuth or custom SMTP), reviews/edits the AI drafts, and launches the
   campaign. The **Bulk Sending Engine** sends emails in safe, rate-limited batches,
   respects the global unsubscribe list, and tracks opens/clicks/replies/bounces.
9. Leads move through a simple **CRM pipeline** (New → Contacted → Interested →
   Closed) as the user works them.
10. For paying clients the user is pitching (Pro/Agency tiers), the user can generate a
    **white-labeled PDF report** per business, showing the Opportunity Score breakdown
    and recommendations, branded with the agency's own logo — something they can literally
    email to a prospect as a mini-audit.
11. Advanced users can also set up a **Local Rank Tracker** — tracking how a business
    ranks in the Google Maps "map pack" across a grid of nearby locations for a keyword,
    updated on a schedule, to either monitor their own clients' rankings or to find which
    competitors dominate an area.
12. All of this is gated by a subscription plan (Stripe-billed) with monthly usage limits
    on leads and emails, enforced automatically.

---

## 5. Full Feature List

### Lead Generation

- Google Maps scraping by keyword + location (Playwright-based, not the paid Places API)
- Per-lead data: name, category, phone, address, rating, review count, website, hours,
  Google Maps URL
- Website scraping for email + social links (Facebook/Instagram/LinkedIn/X)
- Bulk multi-city search
- Duplicate detection/removal

### Lead Intelligence

- **Opportunity Score** (0-100, weighted, with a visible breakdown of _why_) — this is
  the product's signature differentiator versus plain scraper tools
- Score bands: 70-100 High (green), 40-69 Medium (amber), 0-39 Low (gray/red)

### Contact Verification

- Self-built **Email Validation Engine**: syntax check → DNS MX lookup → SMTP handshake
  simulation → catch-all domain detection
- Classifications: Valid / Risky / Invalid / Unknown
- Single and bulk validation, with re-validation after a configurable staleness period

### Outreach

- **AI Email Generator** (Anthropic Claude API) — personalized, non-generic cold emails
  under ~150 words, referencing each lead's specific Opportunity Score reasons, with a
  clear CTA and no spam-trigger language
- Multi-format lead import for campaigns: existing Leads List, PDF, Excel/CSV, or a
  manual pasted list
- Sender connection: Gmail/Workspace OAuth or custom SMTP, with optional automated
  warm-up (gradual volume ramp-up for new sending accounts)
- Rate-limited, randomized-delay bulk sending (protects deliverability)
- Automatic unsubscribe link + sender identification on every email (compliance)
- Open/click/reply/bounce tracking per campaign and per lead

### CRM / Pipeline

- Kanban-style pipeline: New → Contacted → Interested → Closed
- Notes and activity timeline per lead

### Local Rank Tracking

- Grid-based Google Maps rank tracking for a keyword around a business's location
- Scheduled re-checks, historical trend chart
- Competitor visibility (who dominates the grid)

### Reporting

- Auto-generated PDF reports per lead/business with Opportunity Score breakdown and
  recommendations
- White-label branding (logo, brand color, agency contact info) — Pro/Agency plans only

### Team & Account

- Multi-user teams with Admin/Member roles
- Usage dashboard (leads used, emails sent, vs. plan limits)
- Billing via Stripe (plan upgrade/downgrade, invoices, extra-credit purchases)

### Admin (internal, owner-only)

- Platform-wide metrics (MRR, churn, usage)
- User management, support ticket inbox

---

## 6. What Makes This Different From Competitors

Most competing tools (Local Falcon, GMB Everywhere, Hunter.io, Instantly.ai, etc.) each
do **one** piece of this puzzle. This product's differentiation is combining, in one
platform:

1. Lead discovery (scraping)
2. Lead qualification (Opportunity Score — telling the user _who_ to prioritize and _why_)
3. Contact verification (email validation)
4. Outreach (AI-personalized bulk email)
5. Rank tracking
6. Client-ready reporting (white-label)

An agency currently needs 3-5 separate subscriptions to cover what this does in one.

---

## 7. Pricing (Final)

| Plan    | Price   | Leads/mo   | Emails/mo  | AI Emails       | Rank Tracker | White-Label Reports | Team Seats | Support                  |
| ------- | ------- | ---------- | ---------- | --------------- | ------------ | ------------------- | ---------- | ------------------------ |
| Starter | $19/mo  | 500        | 500        | Basic templates | ❌           | ❌                  | 1          | Email                    |
| Growth  | $49/mo  | 2,500      | 3,500      | Full AI         | 1 keyword    | ❌                  | 3          | Priority email           |
| Pro     | $89/mo  | 8,000      | 10,000     | Full AI         | 5 keywords   | ✅                  | 5          | Priority email           |
| Agency  | $149/mo | Unlimited* | Unlimited* | Full AI         | Unlimited    | ✅                  | 10         | Dedicated priority email |

\* "Unlimited" plans carry an internal, non-customer-facing fair-use cap enforced in the
billing/usage system — this must never be described as a literal, uncapped promise in
any user-facing copy.

- Annual billing offers ~20% off any tier.
- Support is **email-only across every tier** — no phone/call support anywhere in the product.
- Extra credits (e.g. +500 emails) can be purchased as a one-off add-on on any plan.

---

## 8. Tech Stack (Fixed — Do Not Substitute)

| Layer                 | Choice                                                                       |
| --------------------- | ---------------------------------------------------------------------------- |
| Frontend              | Next.js 14 (App Router) + TypeScript                                         |
| Styling               | Tailwind CSS + shadcn/ui                                                     |
| Backend               | Next.js API routes (Node.js/TypeScript)                                      |
| Database & Auth       | Supabase (PostgreSQL + Supabase Auth)                                        |
| Background jobs/queue | BullMQ + Upstash Redis                                                       |
| Scraping              | Playwright (Node.js), run as an independent worker                           |
| Email sending         | Nodemailer (Gmail/Workspace OAuth or custom SMTP)                            |
| AI text generation    | Anthropic Claude API (usage-based, gated behind active subscription)         |
| Payments              | Stripe (Checkout + Customer Portal + Webhooks)                               |
| Hosting               | Vercel (frontend/API) + Railway or Render (scraping worker, background jobs) |

This is a single-language (JavaScript/TypeScript) stack end-to-end by design, so the
entire codebase — frontend, backend, and scraping worker — stays consistent and is easy
for Claude Code to build without switching languages or paradigms.

**Why not the official Google Places API for lead data?** It's a paid, per-request API.
This product uses Playwright-based scraping of Google Maps instead, to keep the core
data-gathering feature free to run. Be aware this carries some inherent fragility (Google
may rate-limit or change its page structure) — the scraping engine must fail gracefully
and report clear errors rather than silently returning bad data.

---

## 9. Database Schema (Summary)

Core tables (see the dedicated schema prompt for full detail): `users`, `organizations`,
`team_members`, `subscriptions`, `searches`, `leads`, `campaigns`, `campaign_leads`,
`generated_emails`, `sender_accounts`, `rank_tracker_jobs`, `reports`, `unsubscribes`,
`usage_logs`. Every table is scoped to an organization via Row-Level Security — a user
must never be able to read another organization's data.

---

## 10. Site Map (Summary)

**Public/marketing:** Home, Pricing, Features, About, Blog (list + post), Terms, Privacy,
Refund Policy, Login, Signup, Forgot/Reset Password.

**Authenticated app:** Onboarding Wizard, Dashboard, New Lead Search, Leads List, Lead
Detail, Campaigns List, Campaign Builder, Sender Settings, Rank Tracker, Reports,
CRM/Pipeline, Team Management, Billing, Account Settings.

**Admin (owner-only):** Admin Dashboard, User Management, Support Tickets.

---

## 11. Design System (Summary)

- **Fonts:** Inter only, for both headings and body (different weights).
- **Colors:** Primary/brand `#4F46E5` (indigo), neutral background `#F9FAFB`, success
  `#16A34A`, error/destructive `#DC2626` only — everything else in gray shades.
- **Animations:** subtle, fast (150-400ms max), hover/click micro-interactions on buttons
  and cards, scroll fade-ins on marketing sections, skeleton loaders instead of blank
  screens — never slow or flashy.
- **Non-negotiable:** every button, form, and data view must be fully functional against
  real data — no placeholder/dead UI anywhere, on any page.
- Fully responsive/mobile-first: tested at 375px, 768px, and 1280px+ on every page.

---

## 12. Required External Services / API Keys

| Service                      | Used For                          | Cost                                  |
| ---------------------------- | --------------------------------- | ------------------------------------- |
| Supabase                     | Database + Auth                   | Free tier                             |
| Google OAuth Client          | "Continue with Google" login      | Free                                  |
| Upstash Redis                | Background job queue (BullMQ)     | Free tier                             |
| Anthropic Claude API         | AI email generation               | Paid, usage-based                     |
| Stripe                       | Billing/subscriptions             | Free to integrate (% per transaction) |
| Gmail App Password / Brevo   | Sending campaign emails           | Free tier                             |
| Vercel                       | Hosting (frontend/API)            | Free tier                             |
| Railway or Render            | Hosting the scraping worker       | Free tier                             |
| Domain name                  | Custom domain + sender email      | Paid (~$10-15/yr)                     |
| Proxy service (Phase 2 only) | Avoiding scraping blocks at scale | Paid, optional, skip for MVP          |

No Google Places/Maps API key is required — lead data comes from the self-hosted
scraper, not a paid API.

---

## 13. Build Order (Recommended Phases)

1. **Foundation** — project setup, design system, database schema (must be done first;
   everything else depends on this).
2. **Auth & Onboarding** — signup, login, password reset, onboarding wizard.
3. **Core loop, minimum viable** — New Lead Search → Leads List → Lead Detail, wired to
   the real scraping engine and Opportunity Score.
4. **Contact & Outreach** — Email Validation Engine, Campaign Builder, AI Email
   Generator, Bulk Sending Engine, Sender Settings.
5. **Monetization** — Stripe billing integration, usage enforcement, Pricing page.
6. **Retention & upsell features** — CRM/Pipeline, Rank Tracker, White-Label Reports,
   Team Management.
7. **Marketing site** — Home, Features, About, Blog, legal pages (can be built in
   parallel with phase 2 onward since it doesn't depend on backend logic).
8. **Admin panel** — internal tools, built last since customers never see it.
9. **Final polish** — full responsive audit, full functionality audit (every button/form
   verified against real data, no dead UI anywhere).

---

## 14. Non-Negotiable Product Principles

- **Zero fixed API cost to run**, except the Claude API, which is usage-based and only
  incurred once a customer is already paying (never pre-paid/upfront cost to the
  business).
- **Every feature must be fully functional, not a demo/placeholder** — every button,
  form, and data table must work against real data end-to-end.
- **Mobile-friendly and professional throughout** — this is a paid B2B product and must
  look and feel like one.
- **"Unlimited" is never literally unlimited** — it is always backed by an internal,
  invisible fair-use cap to protect margins, enforced in the billing system, never
  described that way to the customer.
