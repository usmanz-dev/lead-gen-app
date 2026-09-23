"use client";

import { useState } from "react";
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
import { AnimatedPrice } from "@/components/pricing/animated-price";
import { BillingToggle } from "@/components/pricing/billing-toggle";
import { PLANS, type BillingInterval } from "@/lib/plans";
import { Check, ArrowRight } from "lucide-react";

const FAQS = [
  {
    question: "Can I get a refund?",
    answer:
      "If you subscribe to a paid plan for the first time and it isn't working out, contact us within 7 days of your first charge for a full refund, no questions asked. After that, we don't prorate refunds for a partial month, but you can cancel any time to stop future billing. See the full Refund Policy for annual plans and billing-error details.",
  },
  {
    question: "Can I upgrade or downgrade later?",
    answer:
      "Yes, any time, from your billing settings. Upgrades apply immediately; downgrades take effect at the start of your next billing cycle, so you keep your current plan's limits for the rest of the period you've already paid for.",
  },
  {
    question: "What happens if I hit my plan's limit?",
    answer:
      "We'll let you know as you approach your monthly lead and email limits. Once you hit the limit, new searches and sends pause until either your next billing cycle resets the counter, you purchase extra credits, or you upgrade — your existing leads, campaigns, and data are never deleted or locked.",
  },
  {
    question: 'What does "unlimited" actually mean on the Agency plan?',
    answer:
      "It means there's no fixed monthly cap you need to plan around — but to keep the service fast and reliable for everyone, Agency carries a high internal fair-use ceiling in the background. The vast majority of agencies never come close to it. If your usage pattern looks unusual, we'll reach out before taking any action, not after.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes — create an account and start finding leads with no credit card required, then subscribe whenever you're ready to scale up.",
  },
  {
    question: "Do you offer annual billing?",
    answer:
      'Yes, toggle "Annual" above on any plan for roughly 20% off versus paying monthly, billed as a single upfront yearly charge.',
  },
];

export function PricingContent() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <>
      <section className="border-border bg-secondary/40 border-b">
        <Reveal className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            Every plan includes full lead generation, Opportunity Scoring, and
            email validation — pick the size that fits your pipeline.
          </p>

          <div className="mt-8 flex justify-center">
            <BillingToggle value={interval} onChange={setInterval} />
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 0.1}>
              <Card
                className={
                  plan.featured
                    ? "border-primary shadow-primary/10 flex h-full flex-col shadow-md"
                    : "border-border/60 flex h-full flex-col"
                }
              >
                <CardHeader>
                  {plan.featured && (
                    <Badge className="mb-2 w-fit">Most popular</Badge>
                  )}
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <p className="text-3xl font-semibold tabular-nums">
                    <AnimatedPrice
                      value={
                        interval === "monthly"
                          ? plan.monthlyPrice
                          : plan.annualMonthlyPrice
                      }
                    />
                    <span className="text-muted-foreground text-sm font-normal">
                      /mo
                    </span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {interval === "monthly"
                      ? "Billed monthly"
                      : `Billed annually as $${plan.annualMonthlyPrice * 12}/yr`}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="flex-1 space-y-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check
                          className="text-success mt-0.5 size-4 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={plan.featured ? "default" : "outline"}
                    render={
                      <Link
                        href={`/signup?plan=${plan.id}&interval=${interval}`}
                      />
                    }
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
