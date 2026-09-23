import type { Metadata } from "next";
import { Reveal } from "@/components/ui/reveal";
import { ContactForm } from "@/components/about/contact-form";
import { Mail } from "lucide-react";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          About LocalLeads AI
        </h1>
      </Reveal>

      <Reveal delay={0.05} className="mt-16">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Our mission
        </h2>
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed text-balance">
          We believe every local SEO consultant and small agency should have the
          same prospecting firepower as a team ten times their size. Our mission
          is to automate the tedious part of finding new clients — searching,
          qualifying, verifying, and reaching out — so the humans on your team
          can spend their time on strategy and relationships instead of
          spreadsheets.
        </p>
      </Reveal>

      {/* Placeholder founder narrative — replace with your own story before launch. */}
      <Reveal delay={0.05} className="mt-16">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Why we built this
        </h2>
        <div className="text-muted-foreground mt-4 space-y-4 text-lg leading-relaxed">
          <p>
            LocalLeads AI started as a Saturday-afternoon frustration. We were
            running local SEO for a handful of clients and spending more time
            hunting for the next ones than actually doing the work — hours lost
            scrolling Google Maps, guessing which businesses looked &quot;bad
            enough&quot; to need help, then digging through websites one tab at
            a time just to find an email worth sending to.
          </p>
          <p>
            None of that had anything to do with the actual skill of ranking a
            business higher. So we built the tool we wished existed: something
            that finds the businesses, tells you exactly why they need help,
            verifies how to reach them, and drafts the first message —
            automatically, every time.
          </p>
          <p>
            That&apos;s still the whole point. Less time hunting, more time
            closing.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05} className="mt-16">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Get in touch
        </h2>
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
          Questions, feedback, or just want to say hi? Reach us directly at{" "}
          <a
            href="mailto:support@localleads.ai"
            className="text-primary inline-flex items-center gap-1.5 hover:underline"
          >
            <Mail className="size-4" aria-hidden="true" />
            support@localleads.ai
          </a>{" "}
          or use the form below.
        </p>

        <div className="mt-6">
          <ContactForm />
        </div>
      </Reveal>
    </div>
  );
}
