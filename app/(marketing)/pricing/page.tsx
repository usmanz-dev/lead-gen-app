import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { Check, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Pricing" };

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

const FAQS = [
  {
    question: "Can I switch plans later?",
    answer:
      "Yes — upgrade, downgrade, or cancel any time from your billing settings. Changes take effect at the start of your next billing cycle.",
  },
  {
    question: 'What counts as a "lead"?',
    answer:
      "One local business returned by a search counts as one lead, whether or not it has a valid email on file.",
  },
  {
    question: "Is support really email-only?",
    answer:
      "Yes, across every tier — there's no phone support. Priority and dedicated priority tiers get faster response times, not a different channel.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="border-border bg-secondary/40 border-b">
        <Reveal className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Simple, usage-based pricing
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            Every plan includes full lead generation, Opportunity Scoring, and
            email validation. Annual billing saves ~20%.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.1}>
              <Card
                className={
                  plan.featured
                    ? "border-primary shadow-primary/10 h-full shadow-md"
                    : "border-border/60 h-full"
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
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
        <p className="text-muted-foreground mt-6 text-center text-xs">
          * Unlimited plans carry an internal fair-use cap to keep the service
          reliable for everyone. Extra credits (e.g. +500 emails) can be
          purchased as a one-off add-on on any plan.
        </p>
      </section>

      <section className="border-border border-t">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Pricing questions
            </h2>
          </Reveal>
          <div className="mt-10 space-y-6">
            {FAQS.map((faq, i) => (
              <Reveal key={faq.question} delay={i * 0.1}>
                <div>
                  <h3 className="text-sm font-semibold">{faq.question}</h3>
                  <p className="text-muted-foreground mt-1.5 text-sm">
                    {faq.answer}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border bg-primary border-t">
        <Reveal className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-primary-foreground text-2xl font-semibold tracking-tight">
            Ready to find your next client?
          </h2>
          <Button
            size="lg"
            variant="secondary"
            className="mt-6"
            render={<Link href="/signup" />}
          >
            Start Free Trial
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </Reveal>
      </section>
    </>
  );
}
