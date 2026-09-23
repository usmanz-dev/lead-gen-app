import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export function FinalCtaBanner() {
  return (
    <section className="border-border bg-primary border-t">
      <Reveal className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-primary-foreground text-3xl font-semibold tracking-tight">
          Stop guessing which businesses need you
        </h2>
        <p className="text-primary-foreground/80 mx-auto mt-3 max-w-xl">
          Run your first lead search in minutes — no credit card required to get
          started.
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="mt-8"
          render={<Link href="/signup" />}
        >
          Start Free Trial
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </Reveal>
    </section>
  );
}
