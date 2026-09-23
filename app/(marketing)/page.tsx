import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/reveal";
import { HeroMockup } from "@/components/marketing/hero-mockup";
import { FinalCtaBanner } from "@/components/marketing/final-cta-banner";
import {
  Search,
  Gauge,
  MailCheck,
  Send,
  MapPin,
  FileBarChart,
  ArrowRight,
  Check,
  X,
  Quote,
} from "lucide-react";

const TRUST_LOGOS = [
  "Northwind Digital",
  "BrightPath SEO",
  "Anchor & Co. Marketing",
  "Summit Growth Partners",
  "Bluepeak Agency",
];

const PROBLEMS = [
  "Hours lost manually searching Google Maps, city by city",
  "No way to tell which businesses actually need help",
  "Finding a working email means digging through websites one at a time",
  "Generic cold emails that read like spam and get ignored",
];

const SOLUTIONS = [
  "Automated search across any niche and location in seconds",
  "Opportunity Score ranks every lead by how much they need you",
  "Built-in email finder and validator — Valid, Risky, or Invalid",
  "AI writes a personalized email referencing each lead's specific gaps",
];

const FEATURES = [
  {
    icon: Search,
    title: "Lead Extraction",
    description: "Scrape Google Maps by keyword and location — no paid API.",
    href: "/features#lead-extraction",
  },
  {
    icon: Gauge,
    title: "Opportunity Score",
    description: "A 0-100 score with a visible breakdown of exactly why.",
    href: "/features#opportunity-score",
  },
  {
    icon: MailCheck,
    title: "Email Finder & Validator",
    description: "DNS + SMTP-level checks classify every contact you find.",
    href: "/features#email-validator",
  },
  {
    icon: Send,
    title: "AI Outreach Generator",
    description: "Claude-written, non-generic cold emails under 150 words.",
    href: "/features#ai-outreach",
  },
  {
    icon: MapPin,
    title: "Rank Tracker",
    description: "Grid-based Google Maps rank tracking, updated on schedule.",
    href: "/features#rank-tracker",
  },
  {
    icon: FileBarChart,
    title: "White-Label Reports",
    description: "Branded PDF audits you can email straight to a prospect.",
    href: "/features#white-label-reports",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: Search,
    title: "Search",
    description:
      'Enter a keyword like "dentists" and a location like "Karachi" — we scrape every matching business.',
  },
  {
    step: "2",
    icon: Gauge,
    title: "Score & Validate",
    description:
      "Every lead gets an Opportunity Score and a verified, classified email address automatically.",
  },
  {
    step: "3",
    icon: Send,
    title: "Outreach",
    description:
      "Review the AI-drafted email, launch the campaign, and track opens, clicks, and replies.",
  },
];

const PLANS = [
  { name: "Starter", price: "$19" },
  { name: "Growth", price: "$49" },
  { name: "Pro", price: "$89", featured: true },
  { name: "Agency", price: "$149" },
];

// Placeholder quotes — swap in real customer testimonials before launch.
const TESTIMONIALS = [
  {
    quote:
      "We cut our prospecting time from a full day to about twenty minutes. The Opportunity Score alone paid for the subscription in the first week.",
    name: "Sara Ahmed",
    role: "Founder, BrightPath SEO",
  },
  {
    quote:
      "The AI emails actually reference what's wrong with each business instead of sounding like a template. Our reply rate roughly doubled.",
    name: "Marcus Webb",
    role: "Growth Lead, Northwind Digital",
  },
  {
    quote:
      "Having lead gen, verification, and outreach in one place replaced three separate tools we were paying for. Easy call.",
    name: "Priya Nair",
    role: "Operations, Summit Growth Partners",
  },
];

const FAQS = [
  {
    question: "Is there a free trial?",
    answer:
      "Yes — you can create an account and start finding leads with no credit card required. You can upgrade to a paid plan whenever you're ready.",
  },
  {
    question: "How accurate is the lead data?",
    answer:
      "Lead data comes from live Google Maps listings, so it reflects what's publicly visible at the time of your search. Because it's gathered via automated scraping rather than a static database, it stays current — but we recommend spot-checking a business before a high-stakes outreach push.",
  },
  {
    question: "How does the Opportunity Score work?",
    answer:
      "Every lead is scored 0-100 using a weighted set of signals: no website, low review count, weak rating, missing business hours, no social presence, and — when a website exists — poor mobile-friendliness or no SSL. You can see the full breakdown behind any lead's score, not just the number.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes. You can upgrade, downgrade, or cancel from your billing settings at any time. Cancellations take effect at the end of your current billing period — you keep access until then.",
  },
  {
    question: "Do you support team collaboration?",
    answer:
      "Growth, Pro, and Agency plans include multiple team seats with Admin and Member roles, so your whole team can work the same lead pipeline together.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Every organization's data is isolated at the database level with row-level security, so your leads, campaigns, and sender credentials are never visible to other accounts. Sender credentials are encrypted before they're stored.",
  },
  {
    question: "What happens if I exceed my plan's usage limits?",
    answer:
      "We'll let you know as you approach your monthly lead and email limits. You can purchase extra credits as a one-off add-on on any plan, or upgrade to a higher tier — your existing data and campaigns are never interrupted.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-border bg-secondary/40 border-b">
        <Reveal className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Badge variant="secondary" className="mb-4">
                Built for local SEO &amp; marketing agencies
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Find local businesses that need you —{" "}
                <span className="text-primary">before your competitors do</span>
              </h1>
              <p className="text-muted-foreground mt-6 text-lg text-balance">
                Search a niche and location, get a ranked list of local
                businesses that need SEO help, know exactly why they need it,
                and reach them automatically with a personalized email.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" render={<Link href="/signup" />}>
                  Start Free Trial
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

            <HeroMockup />
          </div>
        </Reveal>
      </section>

      {/* Trust bar */}
      <section className="border-border border-b py-10">
        <Reveal className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Placeholder social proof — replace with real client count/logos before launch. */}
          <p className="text-muted-foreground text-center text-xs font-medium tracking-wide uppercase">
            Trusted by 500+ agencies
          </p>
          <div className="text-muted-foreground/70 mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-semibold">
            {TRUST_LOGOS.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Problem -> Solution */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Stop hunting for leads. Start closing them.
          </h2>
          <p className="text-muted-foreground mt-3">
            Most agencies are still doing this the hard way.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Reveal>
            <Card className="border-border/60 h-full" hover={false}>
              <CardHeader>
                <CardTitle className="text-base">The old way</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {PROBLEMS.map((problem) => (
                    <li key={problem} className="flex items-start gap-2.5">
                      <X
                        className="text-destructive mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground">{problem}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="border-primary bg-primary/5 h-full" hover={false}>
              <CardHeader>
                <CardTitle className="text-base">With LocalLeads AI</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {SOLUTIONS.map((solution) => (
                    <li key={solution} className="flex items-start gap-2.5">
                      <Check
                        className="text-success mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{solution}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Key features */}
      <section id="features" className="border-border bg-secondary/40 border-y">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Everything you need to run a lead-gen pipeline
            </h2>
            <p className="text-muted-foreground mt-3">
              An agency normally needs 3-5 separate subscriptions to cover this.
              This is one.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description, href }, i) => (
              <Reveal key={title} delay={(i % 3) * 0.1}>
                <Link href={href} className="block h-full">
                  <Card className="border-border/60 h-full">
                    <CardHeader>
                      <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                      <CardTitle className="mt-3 text-base">{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">
                        {description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            From search to sent, in three steps
          </h2>
          <p className="text-muted-foreground mt-3">
            No juggling between tools — it all happens in one pipeline.
          </p>
        </Reveal>

        <div className="relative mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
          <div
            aria-hidden="true"
            className="border-border absolute top-6 right-0 left-0 hidden border-t border-dashed sm:block"
          />
          {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }, i) => (
            <Reveal
              key={step}
              delay={i * 0.15}
              className="relative text-center"
            >
              <div className="bg-primary text-primary-foreground relative z-10 mx-auto flex size-12 items-center justify-center rounded-full">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold">
                {step}. {title}
              </h3>
              <p className="text-muted-foreground mx-auto mt-2 max-w-xs text-sm">
                {description}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section id="pricing" className="border-border bg-secondary/40 border-y">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Simple, usage-based pricing
            </h2>
            <p className="text-muted-foreground mt-3">
              Every plan includes full lead generation, scoring, and email
              validation.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.1}>
                <Card
                  className={
                    plan.featured
                      ? "border-primary shadow-primary/10 h-full text-center shadow-md"
                      : "border-border/60 h-full text-center"
                  }
                >
                  <CardContent className="pt-2">
                    {plan.featured && (
                      <Badge className="mb-2">Most popular</Badge>
                    )}
                    <div className="text-sm font-medium">{plan.name}</div>
                    <div className="mt-1 text-2xl font-semibold">
                      {plan.price}
                      <span className="text-muted-foreground text-sm font-normal">
                        /mo
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-8 text-center">
            <Link
              href="/pricing"
              className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              See full pricing
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Agencies are already closing more deals
          </h2>
        </Reveal>

        {/* Placeholder testimonials — replace with real customer quotes before launch. */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(({ quote, name, role }, i) => (
            <Reveal key={name} delay={i * 0.1}>
              <Card className="border-border/60 h-full">
                <CardContent className="pt-2">
                  <Quote
                    className="text-primary/30 size-6"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-sm">{quote}</p>
                  <div className="mt-4">
                    <div className="text-sm font-semibold">{name}</div>
                    <div className="text-muted-foreground text-xs">{role}</div>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-border bg-secondary/40 border-y">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Frequently asked questions
            </h2>
          </Reveal>

          <Reveal className="mt-10">
            <Accordion className="border-border bg-card rounded-xl border px-5">
              {FAQS.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger className="text-sm font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      <FinalCtaBanner />
    </>
  );
}
