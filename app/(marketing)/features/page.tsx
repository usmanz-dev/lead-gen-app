import type { Metadata } from "next";
import {
  Search,
  Gauge,
  MailCheck,
  Send,
  MapPin,
  FileBarChart,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { FeatureSection } from "@/components/features/feature-section";
import { FinalCtaBanner } from "@/components/marketing/final-cta-banner";
import {
  LeadExtractionMockup,
  OpportunityScoreMockup,
  EmailValidatorMockup,
  AiOutreachMockup,
  RankTrackerMockup,
  WhiteLabelReportMockup,
} from "@/components/features/feature-mockups";

export const metadata: Metadata = { title: "Features" };

const FEATURES = [
  {
    id: "lead-extraction",
    icon: Search,
    title: "Lead Extraction",
    description:
      "Search any niche and location and LocalLeads AI scrapes Google Maps for every matching business in seconds — no paid Places API, no manual copy-pasting between browser tabs. Every result comes back with the business's name, category, contact info, rating, review count, hours, and website, ready to filter and act on.",
    bullets: [
      "Search by keyword + location, with optional filters like minimum rating or has-website",
      "Bulk multi-city search for scaling across territories",
      "Automatic duplicate detection so the same business never appears twice",
    ],
    whyItMatters:
      "Every hour not spent manually searching Google Maps is an hour spent actually closing deals.",
    mockup: <LeadExtractionMockup />,
  },
  {
    id: "opportunity-score",
    icon: Gauge,
    title: "Opportunity Score",
    description:
      "Every lead is scored 0-100 the moment it's found, weighted by exactly the signals that predict whether a business needs your help: no website, weak reviews, missing hours, no social presence, and more. You see the number and the full breakdown behind it, not a black box.",
    bullets: [
      "Score bands — High, Medium, Low — so you know who to call first",
      "Full breakdown of every contributing factor, visible on every lead",
      "Sort and filter your entire list by score in one click",
    ],
    whyItMatters: "Prioritizing the right 20 leads beats blindly emailing 200.",
    mockup: <OpportunityScoreMockup />,
    reverse: true,
  },
  {
    id: "email-validator",
    icon: MailCheck,
    title: "Email Finder & Validator",
    description:
      "Any email address LocalLeads AI finds on a lead's website gets run through a self-built validation engine automatically — syntax check, DNS MX lookup, SMTP handshake simulation, and catch-all domain detection. You always know whether an address is worth sending to before you send anything.",
    bullets: [
      "Classified Valid, Risky, Invalid, or Unknown — never a guess",
      "Bulk validation across your whole list, or one lead at a time",
      "Automatic re-validation after a configurable staleness period",
    ],
    whyItMatters:
      "A clean sender reputation is worth more than any single campaign — bounces kill deliverability fast.",
    mockup: <EmailValidatorMockup />,
  },
  {
    id: "ai-outreach",
    icon: Send,
    title: "AI Outreach Generator",
    description:
      "Describe your offer once in plain language, and Claude writes a short, specific cold email for every lead you select — referencing that business's actual gaps, not a mail-merge template with a name stitched in. Every draft stays under 150 words with a clear call to action.",
    bullets: [
      "References each lead's specific Opportunity Score reasons automatically",
      "No spam-trigger language, and every email includes a working unsubscribe link",
      "Review and edit every draft before it ever gets sent",
    ],
    whyItMatters:
      "Personalized outreach gets replies; generic templates get deleted.",
    mockup: <AiOutreachMockup />,
    reverse: true,
  },
  {
    id: "rank-tracker",
    icon: MapPin,
    title: "Rank Tracker",
    description:
      "Track how a business actually ranks in the Google Maps map pack across a grid of nearby points for any keyword, updated on a schedule you set. Use it to prove your own results to a client, or to find out which competitor is dominating an area before you pitch it.",
    bullets: [
      "Grid-based tracking shows how visibility changes by location, not just one number",
      "Historical trend charts make before/after results easy to show a client",
      "See which competitors show up across the grid and how often",
    ],
    whyItMatters:
      "You can't sell an SEO result you can't prove — rank history is the easiest close there is.",
    mockup: <RankTrackerMockup />,
  },
  {
    id: "white-label-reports",
    icon: FileBarChart,
    title: "White-Label Reports",
    description:
      "Turn any lead's Opportunity Score into a branded PDF audit in one click — your logo, your brand color, your contact info, their specific weaknesses laid out clearly. Email it straight to a prospect as a mini-consulting deliverable before they've even replied to your first message.",
    bullets: [
      "Full Opportunity Score breakdown with plain-language recommendations",
      "Your agency's logo, brand color, and contact info throughout",
      "Available on Pro and Agency plans",
    ],
    whyItMatters:
      "A branded audit in a prospect's inbox looks like a real consulting deliverable, not a cold pitch.",
    mockup: <WhiteLabelReportMockup />,
    reverse: true,
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="border-border bg-secondary/40 border-b">
        <Reveal className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Everything you need to find, qualify, and close local clients
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            One platform for the entire pipeline — from the first search to the
            signed contract.
          </p>
        </Reveal>
      </section>

      {FEATURES.map((feature) => (
        <FeatureSection key={feature.id} {...feature} />
      ))}

      <FinalCtaBanner />
    </>
  );
}
