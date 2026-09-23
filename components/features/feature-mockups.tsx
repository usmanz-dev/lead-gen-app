import { Search, Sparkles, ShieldCheck, FileText } from "lucide-react";

function MockupFrame({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="bg-primary/15 absolute -inset-6 -z-10 rounded-[3rem] blur-3xl"
      />
      <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-2xl">
        <div className="border-border bg-secondary/60 flex items-center gap-1.5 border-b px-4 py-3">
          <span className="bg-destructive/40 size-2.5 rounded-full" />
          <span className="bg-primary/30 size-2.5 rounded-full" />
          <span className="bg-success/40 size-2.5 rounded-full" />
          <div className="bg-background text-muted-foreground ml-3 flex flex-1 items-center gap-2 rounded-md px-3 py-1 text-xs">
            {label}
          </div>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const EXTRACTED_LEADS = [
  { name: "Riverside Dental Care", meta: "Dentist · 4.2★ (18 reviews)" },
  { name: "Sunset Auto Repair", meta: "Auto Repair · 3.6★ (7 reviews)" },
  { name: "Greenleaf Law Group", meta: "Law Firm · 4.8★ (52 reviews)" },
];

export function LeadExtractionMockup() {
  return (
    <MockupFrame label="dentists in Karachi">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Search className="text-primary size-4" aria-hidden="true" />
        Extracting businesses… 3 of 24 found
      </div>
      <div className="mt-4 space-y-2">
        {EXTRACTED_LEADS.map((lead) => (
          <div
            key={lead.name}
            className="border-border/60 rounded-lg border p-3"
          >
            <div className="text-sm font-medium">{lead.name}</div>
            <div className="text-muted-foreground text-xs">{lead.meta}</div>
          </div>
        ))}
        <div className="border-border/60 text-muted-foreground rounded-lg border border-dashed p-3 text-center text-xs">
          21 more loading…
        </div>
      </div>
    </MockupFrame>
  );
}

const SCORE_FACTORS = [
  { label: "No website found", points: "+25" },
  { label: "Low review count", points: "+18" },
  { label: "No SSL certificate", points: "+12" },
  { label: "Missing business hours", points: "+9" },
];

export function OpportunityScoreMockup() {
  return (
    <MockupFrame label="Riverside Dental Care">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Opportunity Score</div>
          <div className="text-muted-foreground text-xs">
            Why this lead needs you
          </div>
        </div>
        <div className="border-success/30 bg-success/10 text-success flex size-14 items-center justify-center rounded-full border-4 text-lg font-bold">
          82
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {SCORE_FACTORS.map((factor) => (
          <div
            key={factor.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{factor.label}</span>
            <span className="text-primary font-medium">{factor.points}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

export function EmailValidatorMockup() {
  return (
    <MockupFrame label="riverside.dental@gmail.com">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">riverside.dental@gmail.com</span>
        <span className="bg-success/10 text-success rounded-full px-2.5 py-1 text-xs font-semibold">
          Valid
        </span>
      </div>
      <div className="mt-4 space-y-2.5 text-sm">
        {[
          "Syntax check passed",
          "DNS MX record found",
          "SMTP handshake succeeded",
          "Not a catch-all domain",
        ].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <ShieldCheck
              className="text-success size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{step}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

export function AiOutreachMockup() {
  return (
    <MockupFrame label="New campaign email">
      <div className="flex items-center gap-2">
        <Sparkles className="text-primary size-4" aria-hidden="true" />
        <span className="text-xs font-semibold">AI generated</span>
      </div>
      <div className="border-border/60 mt-3 rounded-lg border p-3">
        <div className="text-muted-foreground text-xs">Subject</div>
        <div className="mt-0.5 text-sm font-medium">
          Quick idea for Riverside Dental&apos;s website
        </div>
      </div>
      <div className="text-muted-foreground mt-3 space-y-2 text-xs leading-relaxed">
        <p>Hi there,</p>
        <p>
          I noticed Riverside Dental doesn&apos;t have a website yet — most
          patients check online before booking, so that&apos;s likely costing
          you new patients every week...
        </p>
      </div>
    </MockupFrame>
  );
}

const GRID_RANKS = [3, 1, 4, 2, 1, 5, 6, 3, 2];

function rankColor(rank: number) {
  if (rank <= 3) return "bg-success text-success-foreground";
  if (rank <= 10) return "bg-primary text-primary-foreground";
  return "bg-muted text-muted-foreground";
}

export function RankTrackerMockup() {
  return (
    <MockupFrame label='Rank tracker · "dentist near me"'>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Riverside Dental Care</span>
        <span className="text-muted-foreground text-xs">Avg. rank: 3</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {GRID_RANKS.map((rank, i) => (
          <div
            key={i}
            className={`flex aspect-square items-center justify-center rounded-lg text-sm font-semibold ${rankColor(rank)}`}
          >
            {rank}
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

export function WhiteLabelReportMockup() {
  return (
    <MockupFrame label="riverside-dental-audit.pdf">
      <div className="border-border/60 rounded-lg border">
        <div className="border-border/60 flex items-center gap-2 border-b p-3">
          <div className="bg-primary flex size-6 items-center justify-center rounded-md text-xs font-bold text-white">
            A
          </div>
          <span className="text-xs font-semibold">
            Acme Agency — Local SEO Audit
          </span>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2">
            <FileText className="text-primary size-4" aria-hidden="true" />
            <span className="text-sm font-medium">Riverside Dental Care</span>
          </div>
          <div className="text-muted-foreground mt-3 space-y-1.5 text-xs">
            <p>✓ Opportunity Score: 82/100</p>
            <p>✓ No website detected</p>
            <p>✓ 3 recommendations included</p>
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}
