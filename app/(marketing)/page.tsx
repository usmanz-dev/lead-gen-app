import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Gauge,
  MailCheck,
  Send,
  KanbanSquare,
  FileBarChart,
  MapPin,
  ArrowRight,
  Check,
} from "lucide-react";

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: Search,
    title: "Search a niche + location",
    description:
      'Type in a keyword like "dentists" and a location like "Karachi." We scrape Google Maps for every matching local business.',
  },
  {
    step: "2",
    icon: Gauge,
    title: "See who needs help — and why",
    description:
      "Every lead gets an Opportunity Score (0-100) based on missing website, low reviews, weak rating, and more — with a visible breakdown.",
  },
  {
    step: "3",
    icon: Send,
    title: "Reach them automatically",
    description:
      "Verified emails, AI-personalized cold outreach, and rate-limited bulk sending — tracked from open to reply, right in your pipeline.",
  },
];

const FEATURES = [
  {
    icon: Search,
    title: "Lead Generation",
    description:
      "Playwright-based Google Maps scraping by keyword + location — no paid Places API. Pulls name, category, rating, reviews, website, hours, and contact info.",
  },
  {
    icon: Gauge,
    title: "Opportunity Score",
    description:
      "A weighted 0-100 score with a visible breakdown of exactly why a business is a good sales target — this product's signature differentiator.",
  },
  {
    icon: MailCheck,
    title: "Email Validation Engine",
    description:
      "Self-built DNS + SMTP-level checker classifies every contact Valid, Risky, Invalid, or Unknown — no paid validation API required.",
  },
  {
    icon: Send,
    title: "AI Email Generator",
    description:
      "Claude-powered, non-generic cold emails under ~150 words that reference each lead's specific weaknesses — plus rate-limited bulk sending.",
  },
  {
    icon: KanbanSquare,
    title: "CRM Pipeline",
    description:
      "A simple Kanban pipeline — New, Contacted, Interested, Closed — with notes and an activity timeline per lead.",
  },
  {
    icon: MapPin,
    title: "Local Rank Tracker",
    description:
      "Grid-based Google Maps rank tracking around a business's location, updated on a schedule, with competitor visibility.",
  },
  {
    icon: FileBarChart,
    title: "White-Label Reports",
    description:
      "Auto-generated, branded PDF audits per business — something you can email straight to a prospect as a mini-audit.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$19",
    leads: "500 leads/mo",
    emails: "500 emails/mo",
    ai: "Basic templates",
    highlights: ["1 team seat", "Email support"],
  },
  {
    name: "Growth",
    price: "$49",
    leads: "2,500 leads/mo",
    emails: "3,500 emails/mo",
    ai: "Full AI",
    highlights: ["1 rank tracker keyword", "3 team seats", "Priority email"],
  },
  {
    name: "Pro",
    price: "$89",
    leads: "8,000 leads/mo",
    emails: "10,000 emails/mo",
    ai: "Full AI",
    highlights: [
      "5 rank tracker keywords",
      "White-label reports",
      "5 team seats",
    ],
    featured: true,
  },
  {
    name: "Agency",
    price: "$149",
    leads: "Unlimited* leads/mo",
    emails: "Unlimited* emails/mo",
    ai: "Full AI",
    highlights: [
      "Unlimited rank tracker",
      "White-label reports",
      "10 team seats",
      "Dedicated priority email",
    ],
  },
];

export default function HomePage() {
  return (
    <>
      <section className="border-border bg-secondary/40 border-b">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              Built for local SEO &amp; marketing agencies
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Find local businesses that need you —{" "}
              <span className="text-primary">before your competitors do</span>
            </h1>
            <p className="text-muted-foreground mt-6 text-lg text-balance">
              Search a niche and location, get a ranked list of local businesses
              that need SEO help, know exactly why they need it, and reach them
              automatically with a personalized email.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/signup" />}>
                Start finding leads
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<a href="#how-it-works" />}
              >
                See how it works
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            From search to sent, in one platform
          </h2>
          <p className="text-muted-foreground mt-3">
            Most tools cover one piece of this puzzle. This one covers all of
            it.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
            <div key={step} className="relative">
              <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold">
                <span className="text-primary">{step}.</span> {title}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="border-border bg-secondary/40 border-t">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Everything you need to run a lead-gen pipeline
            </h2>
            <p className="text-muted-foreground mt-3">
              An agency normally needs 3-5 separate subscriptions to cover this.
              This is one.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border-border/60">
                <CardHeader>
                  <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <CardTitle className="mt-3 text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Simple, usage-based pricing
          </h2>
          <p className="text-muted-foreground mt-3">
            Every plan includes full lead generation, scoring, and email
            validation. Annual billing saves ~20%.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.featured
                  ? "border-primary shadow-primary/10 shadow-md"
                  : "border-border/60"
              }
            >
              <CardHeader>
                {plan.featured && (
                  <Badge className="mb-2 w-fit">Most popular</Badge>
                )}
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <p className="text-3xl font-semibold">
                  {plan.price}
                  <span className="text-muted-foreground text-sm font-normal">
                    /mo
                  </span>
                </p>
              </CardHeader>
              <CardContent>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check
                      className="text-success mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    {plan.leads}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check
                      className="text-success mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    {plan.emails}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check
                      className="text-success mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    {plan.ai}
                  </li>
                  {plan.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <Check
                        className="text-success mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={plan.featured ? "default" : "outline"}
                  render={<Link href="/signup" />}
                >
                  Get started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-muted-foreground mt-6 text-center text-xs">
          * Unlimited plans carry an internal fair-use cap to keep the service
          reliable for everyone.
        </p>
      </section>

      <section className="border-border bg-primary border-t">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-primary-foreground text-3xl font-semibold tracking-tight">
            Stop guessing which businesses need you
          </h2>
          <p className="text-primary-foreground/80 mx-auto mt-3 max-w-xl">
            Run your first lead search in minutes — no credit card required to
            get started.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8"
            render={<Link href="/signup" />}
          >
            Create your account
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </section>
    </>
  );
}
