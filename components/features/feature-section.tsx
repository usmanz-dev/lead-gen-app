import { Check, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

export interface FeatureSectionProps {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  whyItMatters: string;
  mockup: React.ReactNode;
  /** Puts the mockup on the right (text on the left) on desktop. */
  reverse?: boolean;
}

export function FeatureSection({
  id,
  icon: Icon,
  title,
  description,
  bullets,
  whyItMatters,
  mockup,
  reverse = false,
}: FeatureSectionProps) {
  return (
    <section id={id} className="py-16 sm:py-20">
      <Reveal className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Mockup is always first in DOM order, so it stacks on top on mobile. */}
          <div className={cn(reverse && "lg:order-2")}>{mockup}</div>

          <div className={cn(reverse && "lg:order-1")}>
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h2>
            <p className="text-muted-foreground mt-3 text-balance">
              {description}
            </p>
            <ul className="mt-5 space-y-2.5">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5 text-sm">
                  <Check
                    className="text-success mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <p className="border-primary bg-primary/5 mt-6 rounded-lg border-l-2 py-2 pl-4 text-sm">
              <span className="font-semibold">Why this matters:</span>{" "}
              <span className="text-muted-foreground">{whyItMatters}</span>
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
